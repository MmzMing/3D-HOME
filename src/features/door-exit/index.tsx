import { ExternalLink, RefreshCw } from 'lucide-react';

import { ModalShell } from '@/components/common/modal-shell';
import { feedsConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';

export function DoorExitDialog() {
  const open = useRoomStore((state) => state.isDoorExitPromptOpen);
  const exitFeedId = useRoomStore((state) => state.doorExitFeedId);
  const refreshExitLink = useRoomStore((state) => state.refreshDoorExitLink);
  const setOpen = useRoomStore((state) => state.setDoorExitPromptOpen);
  const exitFeed =
    feedsConfig.find((feed) => feed.id === exitFeedId) ?? feedsConfig.find((feed) => feed.enabled);

  if (exitFeed === undefined) return null;

  return (
    <ModalShell
      open={open}
      size="compact"
      title="门外的去处"
      description="门户已经开启，选择你的下一站"
      onOpenChange={setOpen}
    >
      <section className="door-exit-confirm" aria-label="友链跳转确认">
        <p>
          即将在新标签页打开 RSS 友链 <strong>{exitFeed.name}</strong>。
        </p>
        <div className="door-exit-destination">
          <div className="door-exit-link">
            <span>{exitFeed.siteUrl}</span>
            <ExternalLink aria-hidden="true" size={15} />
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="随机刷新目的地"
            title="随机刷新目的地"
            onClick={refreshExitLink}
          >
            <RefreshCw aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="door-exit-actions">
          <button type="button" className="secondary-action" onClick={() => setOpen(false)}>
            取消
          </button>
          <button
            type="button"
            className="primary-action"
            onClick={() => {
              window.open(exitFeed.siteUrl, '_blank', 'noopener,noreferrer');
              setOpen(false);
            }}
          >
            前往{exitFeed.name}
            <ExternalLink aria-hidden="true" size={16} />
          </button>
        </div>
      </section>
    </ModalShell>
  );
}
