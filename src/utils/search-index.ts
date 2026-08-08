import MiniSearch from 'minisearch';

import { feedsConfig, linksConfig, profileConfig } from '@/config';

export interface SearchDocument {
  id: string;
  kind: string;
  title: string;
  url?: string;
}

interface IndexedDocument extends SearchDocument {
  content: string;
}

const index = new MiniSearch<IndexedDocument>({
  fields: ['title', 'content', 'kind'],
  storeFields: ['id', 'title', 'kind', 'url'],
  searchOptions: { boost: { title: 2 }, fuzzy: 0.2, prefix: true },
});

const baseDocuments: IndexedDocument[] = [
  ...linksConfig.map((link) => ({
    content: `${link.description} ${link.tags.join(' ')}`,
    id: `link:${link.id}`,
    kind: '链接',
    title: link.title,
    url: link.url,
  })),
  ...feedsConfig.map((feed) => ({
    content: feed.tags.join(' '),
    id: `feed:${feed.id}`,
    kind: 'RSS',
    title: feed.name,
    url: feed.siteUrl,
  })),
  {
    content: `${profileConfig.bio} ${profileConfig.intro.role} ${profileConfig.skills
      .flatMap((group) => group.items.map((item) => item.name))
      .join(' ')}`,
    id: 'profile:owner',
    kind: '个人资料',
    title: profileConfig.name,
  },
];

index.addAll(baseDocuments);

export function addSearchDocuments(documents: readonly IndexedDocument[]) {
  documents.forEach((document) => {
    if (!index.has(document.id)) index.add(document);
  });
}

export function searchDocuments(query: string): SearchDocument[] {
  if (query.trim().length === 0) return [];
  return index
    .search(query.trim())
    .slice(0, 8)
    .map((result) => ({
      id: String(result.id),
      kind: String(result.kind),
      title: String(result.title),
      ...(typeof result.url === 'string' ? { url: result.url } : {}),
    }));
}
