import { useQuery } from '@tanstack/react-query';

import { getGitHubData } from '@/api';
import { GitHubCard } from '@/components/cards/github-card';
import { ProfileCard } from '@/components/cards/profile-card';
import { ModalShell } from '@/components/common/modal-shell';
import { ErrorStatus, LoadingStatus } from '@/components/common/status-view';
import { profileConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';

export function ProfileDialog() {
  const panel = useRoomStore((state) => state.panel);
  const tab = useRoomStore((state) => state.profileTab);
  const closePanel = useRoomStore((state) => state.closePanel);
  const setTab = useRoomStore((state) => state.setProfileTab);
  const github = useQuery({
    enabled: panel === 'profile' && tab === 'github',
    queryFn: getGitHubData,
    queryKey: ['github', profileConfig.github.username],
    staleTime: 15 * 60_000,
  });

  return (
    <ModalShell
      open={panel === 'profile'}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
      title="个人信息墙"
      description="个人资料与 GitHub 公开信息"
    >
      <div className="segmented-control" role="tablist" aria-label="个人信息视图">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'about'}
          onClick={() => setTab('about')}
        >
          关于
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'github'}
          onClick={() => setTab('github')}
        >
          GitHub
        </button>
      </div>
      {tab === 'about' ? <ProfileCard profile={profileConfig} /> : null}
      {tab === 'github' && github.isLoading ? <LoadingStatus label="正在读取 GitHub" /> : null}
      {tab === 'github' && github.isError ? (
        <>
          <ProfileCard profile={profileConfig} />
          <ErrorStatus
            message="GitHub 数据暂不可用，静态资料仍可浏览。"
            onRetry={() => void github.refetch()}
          />
        </>
      ) : null}
      {tab === 'github' && github.data !== undefined ? (
        <GitHubCard data={github.data.data} />
      ) : null}
    </ModalShell>
  );
}
