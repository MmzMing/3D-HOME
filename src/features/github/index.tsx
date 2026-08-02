import { useQuery } from '@tanstack/react-query';

import { getGitHubData } from '@/api';
import { GitHubCard } from '@/components/cards/github-card';
import { ModalShell } from '@/components/common/modal-shell';
import { ErrorStatus, LoadingStatus } from '@/components/common/status-view';
import { profileConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';

export function GitHubDialog() {
  const panel = useRoomStore((state) => state.panel);
  const closePanel = useRoomStore((state) => state.closePanel);
  const github = useQuery({
    enabled: panel === 'github',
    queryFn: getGitHubData,
    queryKey: ['github', profileConfig.github.username],
    staleTime: 15 * 60_000,
  });

  return (
    <ModalShell
      open={panel === 'github'}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
      title="GitHub"
      description="GitHub 公开信息"
    >
      {github.isLoading ? <LoadingStatus label="正在读取 GitHub" /> : null}
      {github.isError ? (
        <ErrorStatus
          message="GitHub 数据暂不可用，请稍后重试。"
          onRetry={() => void github.refetch()}
        />
      ) : null}
      {github.data !== undefined ? <GitHubCard data={github.data.data} /> : null}
    </ModalShell>
  );
}
