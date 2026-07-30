import { z } from 'zod';

import { requestApi } from '@/api/http';

const feedArticleSchema = z.object({
  excerpt: z.string(),
  feedId: z.string(),
  imageUrl: z.url().nullable(),
  publishedAt: z.string().nullable(),
  sourceName: z.string(),
  tags: z.array(z.string()),
  title: z.string(),
  url: z.url(),
});

const feedsSchema = z.object({
  articles: z.array(feedArticleSchema),
  failures: z.array(z.object({ feedId: z.string(), message: z.string(), retryable: z.boolean() })),
});

export type FeedArticle = z.infer<typeof feedArticleSchema>;
export type FeedsData = z.infer<typeof feedsSchema>;

export function getFeed(feedId: string) {
  return requestApi(`/api/feeds?sources=${encodeURIComponent(feedId)}`, feedsSchema);
}
