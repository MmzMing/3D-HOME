import { Code2, ExternalLink, Globe2, Image, Music2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ModalShell } from '@/components/common/modal-shell';
import { searchConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';
import { runRoomCommand } from '@/utils/room-commands';
import { searchDocuments, type SearchDocument } from '@/utils/search-index';

const icons = { Code2, Globe2, Image, Music2 };
type SearchItem = (typeof searchConfig.scopes)[number]['items'][number];
type ExternalItem = Extract<SearchItem, { kind: 'external' }>;

function isSearchableExternal(item: SearchItem): item is ExternalItem {
  return item.kind === 'external' && item.searchTemplate !== undefined;
}

export function SearchDialog() {
  const panel = useRoomStore((state) => state.panel);
  const closePanel = useRoomStore((state) => state.closePanel);
  const openFeed = useRoomStore((state) => state.openFeed);
  const openLink = useRoomStore((state) => state.openLink);
  const fallback = searchConfig.scopes[0];
  const [scopeId, setScopeId] = useState(fallback?.id ?? '');
  const [query, setQuery] = useState('');
  const scope = searchConfig.scopes.find((item) => item.id === scopeId) ?? fallback;
  const externalItems = scope?.items.filter(isSearchableExternal) ?? [];
  const [engineId, setEngineId] = useState(externalItems[0]?.id ?? '');
  const results = useMemo(() => searchDocuments(query), [query]);
  if (scope === undefined) return null;
  const ScopeIcon = icons[scope.icon as keyof typeof icons];
  const engine = externalItems.find((item) => item.id === engineId) ?? externalItems[0];

  function activateDocument(document: SearchDocument) {
    if (document.id.startsWith('link:')) openLink(document.id.slice(5));
    else if (document.id.startsWith('feed:')) openFeed(document.id.slice(5));
    else if (document.id === 'profile:owner') runRoomCommand('open-profile');
    else if (document.url !== undefined) window.open(document.url, '_blank', 'noopener,noreferrer');
  }

  function submit() {
    if (query.trim().length === 0 || engine?.searchTemplate === undefined) return;
    window.open(
      engine.searchTemplate.replace('{query}', encodeURIComponent(query.trim())),
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <ModalShell
      open={panel === 'search'}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
      title="搜索终端"
      description="站内内容与外部搜索"
    >
      <div className="search-scopes" role="tablist" aria-label="搜索分类">
        {searchConfig.scopes.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons];
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === scope.id}
              onClick={() => {
                setScopeId(item.id);
                const next = item.items.find(isSearchableExternal);
                setEngineId(next?.id ?? '');
              }}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <ScopeIcon aria-hidden="true" size={20} />
        <label>
          <span className="visually-hidden">搜索内容</span>
          <input
            type="search"
            value={query}
            placeholder={engine === undefined ? scope.placeholder : `在 ${engine.label} 中搜索`}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
        <button type="submit" className="icon-button" aria-label="搜索">
          <Search aria-hidden="true" size={19} />
        </button>
      </form>
      {externalItems.length === 0 ? null : (
        <div className="search-engines" aria-label="搜索服务">
          {externalItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === engine?.id}
              onClick={() => setEngineId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {query.trim().length > 0 ? (
        <section className="search-results" aria-label="站内搜索结果">
          <h2>站内结果</h2>
          {results.length === 0 ? (
            <p>没有匹配内容。</p>
          ) : (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <button type="button" onClick={() => activateDocument(result)}>
                    <span>
                      <small>{result.kind}</small>
                      <strong>{result.title}</strong>
                    </span>
                    <ExternalLink aria-hidden="true" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </ModalShell>
  );
}
