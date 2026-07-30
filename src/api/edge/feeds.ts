import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

import {
  createRequestId,
  failure,
  fetchWithTimeout,
  getEdgeCache,
  isPublicHttpsUrl,
  success,
  type EdgeContext,
} from './shared.ts';
import feedsConfigData from '../../config/feeds.json' with { type: 'json' };

const maxFeedBytes = 1_000_000;
const maxArticlesPerFeed = 20;
const maxSelectedFeeds = 5;
const feedLoadConcurrency = 5;
const feedTimeoutMs = 3_000;

const feedSchema = z.object({
  avatar: z.string().refine(isPublicHttpsUrl, '头像必须使用公开 HTTPS 地址。').optional(),
  defaultFetch: z.boolean(),
  enabled: z.boolean(),
  feedUrl: z.string().refine(isPublicHttpsUrl, '订阅源必须使用公开 HTTPS 地址。'),
  id: z.string().regex(/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/),
  name: z.string().min(1),
  siteUrl: z.string().refine(isPublicHttpsUrl, '站点必须使用公开 HTTPS 地址。'),
  tags: z.array(z.string().min(1)),
});

const feedsSchema = z.array(feedSchema);

type FeedConfig = z.infer<typeof feedSchema>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asItems(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

function text(value: unknown): string {
  if (typeof value === 'string') {
    return value
      .replace(/<!--[\s\S]*?(?:-->|$)|<\/?[a-z][^>]*(?:>|$)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const record = asRecord(value);

  if (record === null) {
    return '';
  }

  return text(record['#text'] ?? record.content ?? record.value);
}

function secureUrl(value: unknown): string | null {
  const candidate = text(value);
  return isPublicHttpsUrl(candidate) ? candidate : null;
}

function publishedAt(value: unknown): string | null {
  const candidate = text(value);
  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function imageUrl(item: Record<string, unknown>): string | null {
  const media = asRecord(item['media:content']) ?? asRecord(item.thumbnail);
  const enclosure = asRecord(item.enclosure);
  return secureUrl(media?.['@_url'] ?? enclosure?.['@_url'] ?? item.image);
}

function normalizeItem(itemValue: unknown, feed: FeedConfig, atom: boolean) {
  const item = asRecord(itemValue);

  if (item === null) {
    return null;
  }

  const url = atom
    ? secureUrl(
        asItems(item.link)
          .map(asRecord)
          .find((link) => link?.['@_rel'] !== 'self')?.['@_href'],
      )
    : secureUrl(item.link ?? asRecord(item.guid)?.['#text']);
  const title = text(item.title);

  if (url === null || title.length === 0) {
    return null;
  }

  const excerpt = text(item.description ?? item.summary ?? item.content).slice(0, 360);
  const categories = asItems(item.category)
    .map((category) => text(asRecord(category)?.['@_term'] ?? category))
    .filter((category) => category.length > 0);

  return {
    excerpt,
    feedId: feed.id,
    imageUrl: imageUrl(item),
    publishedAt: publishedAt(item.pubDate ?? item.published ?? item.updated),
    sourceName: feed.name,
    tags: [...new Set([...feed.tags, ...categories])],
    title,
    url,
  };
}

function normalizeFeed(xml: string, feed: FeedConfig) {
  const parsed = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
  }).parse(xml) as unknown;
  const root = asRecord(parsed);
  const rssChannel = asRecord(asRecord(root?.rss)?.channel) ?? asRecord(root?.channel);

  if (rssChannel !== null) {
    return asItems(rssChannel.item)
      .map((item) => normalizeItem(item, feed, false))
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) => (right.publishedAt ?? '').localeCompare(left.publishedAt ?? ''))
      .slice(0, maxArticlesPerFeed);
  }

  const atomFeed = asRecord(root?.feed);

  if (atomFeed !== null) {
    return asItems(atomFeed.entry)
      .map((item) => normalizeItem(item, feed, true))
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) => (right.publishedAt ?? '').localeCompare(left.publishedAt ?? ''))
      .slice(0, maxArticlesPerFeed);
  }

  return [];
}

async function loadConfiguredFeeds(feeds: readonly FeedConfig[]) {
  const settled = new Array<
    PromiseSettledResult<{ articles: ReturnType<typeof normalizeFeed>; feed: FeedConfig }>
  >(feeds.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < feeds.length) {
      const index = nextIndex;
      nextIndex += 1;
      const feed = feeds[index];

      if (feed !== undefined) {
        settled[index] = await Promise.resolve(
          loadFeed(feed).then((articles) => ({ articles, feed })),
        ).then(
          (value) => ({ status: 'fulfilled', value }),
          (reason: unknown) => ({ status: 'rejected', reason }),
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(feedLoadConcurrency, feeds.length) }, () => worker()),
  );
  return settled;
}

async function loadFeed(feed: FeedConfig) {
  const response = await fetchWithTimeout(
    new URL(feed.feedUrl),
    {
      headers: {
        accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9',
      },
      redirect: 'manual',
    },
    feedTimeoutMs,
  );
  const contentType = response.headers.get('content-type') ?? '';
  const contentLength = Number(response.headers.get('content-length') ?? 0);

  if (
    !response.ok ||
    response.status >= 300 ||
    contentLength > maxFeedBytes ||
    !/(?:application|text)\/(?:atom\+xml|rss\+xml|xml)/i.test(contentType)
  ) {
    throw new Error('feed-unavailable');
  }

  const xml = await response.text();

  if (new TextEncoder().encode(xml).byteLength > maxFeedBytes) {
    throw new Error('feed-too-large');
  }

  return normalizeFeed(xml, feed);
}

export async function handleFeedsGet(context: EdgeContext) {
  const requestId = createRequestId();
  const configuredFeeds = feedsSchema.safeParse(feedsConfigData);

  if (!configuredFeeds.success) {
    return failure('invalid-configuration', '订阅源配置无效。', requestId, false, 503);
  }

  const requestUrl = new URL(context.request.url);
  const enabledFeeds = configuredFeeds.data.filter((feed) => feed.enabled);
  const requestedSourceIds = requestUrl.searchParams
    .get('sources')
    ?.split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  const selectedSourceIds =
    requestedSourceIds === undefined
      ? enabledFeeds.filter((feed) => feed.defaultFetch).map((feed) => feed.id)
      : [...new Set(requestedSourceIds)];

  if (selectedSourceIds.length > maxSelectedFeeds) {
    return failure('invalid-request', '一次最多选择 5 个订阅源。', requestId, false, 422);
  }

  const feeds = enabledFeeds.filter((feed) => selectedSourceIds.includes(feed.id));

  if (feeds.length !== selectedSourceIds.length) {
    return failure('invalid-request', '选择了无效或已停用的订阅源。', requestId, false, 422);
  }

  if (feeds.length === 0) {
    return success({ articles: [], failures: [] }, requestId);
  }

  const cacheUrl = new URL(requestUrl);
  cacheUrl.searchParams.set('sources', feeds.map((feed) => feed.id).join(','));
  const cacheKey = new Request(cacheUrl);
  const cached = await getEdgeCache().match(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const settled = await loadConfiguredFeeds(feeds);
  const articles = settled
    .flatMap((result) => (result.status === 'fulfilled' ? result.value.articles : []))
    .sort((left, right) => (right.publishedAt ?? '').localeCompare(left.publishedAt ?? ''))
    .filter(
      (article, index, source) =>
        source.findIndex((candidate) => candidate.url === article.url) === index,
    )
    .slice(0, maxArticlesPerFeed * maxSelectedFeeds);
  const failures = settled.flatMap((result, index) => {
    if (result.status === 'fulfilled') {
      return [];
    }

    const feed = feeds[index];
    return feed === undefined
      ? []
      : [
          {
            feedId: feed.id,
            message: `${feed.name} 暂时无法获取。`,
            retryable: true,
          },
        ];
  });
  const response = success({ articles, failures }, requestId);
  context.waitUntil(getEdgeCache().put(cacheKey, response.clone()));
  return response;
}
