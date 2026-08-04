import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';

import { getFeed } from '@/api';
import { FeedArticleCard } from '@/components/cards/feed-article-card';
import { ModalShell } from '@/components/common/modal-shell';
import { ObjectShowcase } from '@/components/common/object-showcase';
import { ErrorStatus, LoadingStatus } from '@/components/common/status-view';
import { feedsConfig } from '@/config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useRoomStore } from '@/stores/room-store';

export function FeedDialog() {
  const panel = useRoomStore((state) => state.panel);
  const feedId = useRoomStore((state) => state.selectedFeedId);
  const closePanel = useRoomStore((state) => state.closePanel);
  const isDesktop = useMediaQuery('(min-width: 720px)');
  const feed = feedsConfig.find((item) => item.id === feedId);
  const open = panel === 'feed' && feed !== undefined;
  const query = useQuery({
    enabled: open,
    queryFn: () => getFeed(feedId ?? ''),
    queryKey: ['feed', feedId],
    staleTime: 10 * 60_000,
  });

  const content = (
    <>
      {feed === undefined ? null : (
        <div className="feed-source-heading">
          <div>
            <p className="eyebrow">RSS SOURCE</p>
            <p>{feed.tags.join(' / ')}</p>
          </div>
          <a href={feed.siteUrl} target="_blank" rel="noopener noreferrer">
            访问站点
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        </div>
      )}
      {query.isLoading ? <LoadingStatus label="正在读取订阅" /> : null}
      {query.isError ? (
        <ErrorStatus
          message={`${feed?.name ?? '该订阅'}暂时无法获取。`}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.data?.data.articles.length === 0 ? (
        <p className="empty-state">当前来源没有可显示的文章。</p>
      ) : null}
      {query.data === undefined ? null : (
        <div className="feed-list">
          {query.data.data.articles.map((article) => (
            <FeedArticleCard key={article.url} article={article} />
          ))}
        </div>
      )}
    </>
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) closePanel();
  };

  if (isDesktop) {
    return (
      <ObjectShowcase
        dismissOnOutside={false}
        layout="bookshelf-split"
        open={open}
        onOpenChange={handleOpenChange}
        title={feed?.name ?? 'RSS'}
        description="从书架取出的最新文章"
      >
        {content}
      </ObjectShowcase>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title={feed?.name ?? 'RSS'}
      description="从书架取出的最新文章"
    >
      {content}
    </ModalShell>
  );
}
