import { useQuery } from '@tanstack/react-query';

import { getGitHubData } from '@/api';
import { GitHubCard } from '@/components/cards/github-card';
import { ModalShell } from '@/components/common/modal-shell';
import { ObjectShowcase } from '@/components/common/object-showcase';
import { ErrorStatus, LoadingStatus } from '@/components/common/status-view';
import { profileConfig } from '@/config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useRoomStore } from '@/stores/room-store';

export function GitHubDialog() {
  const panel = useRoomStore((state) => state.panel);
  const closePanel = useRoomStore((state) => state.closePanel);
  const isDesktop = useMediaQuery('(min-width: 720px)');
  const open = panel === 'github';
  const github = useQuery({
    enabled: open,
    queryFn: getGitHubData,
    queryKey: ['github', profileConfig.github.username],
    staleTime: 15 * 60_000,
  });

  const content = (
    <>
      {github.isLoading ? <LoadingStatus label="正在读取 GitHub" /> : null}
      {github.isError ? (
        <ErrorStatus
          message="GitHub 数据暂不可用，请稍后重试。"
          onRetry={() => void github.refetch()}
        />
      ) : null}
      {github.data !== undefined ? <GitHubCard data={github.data.data} /> : null}
    </>
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) closePanel();
  };

  if (isDesktop) {
    return (
      <ObjectShowcase
        layout="laptop-split"
        open={open}
        onOpenChange={handleOpenChange}
        title="GitHub"
        description="GitHub 公开信息"
      >
        {content}
      </ObjectShowcase>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title="GitHub"
      description="GitHub 公开信息"
    >
      {content}
    </ModalShell>
  );
}
