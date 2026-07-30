import { LinkDetailCard } from '@/components/cards/link-detail-card';
import { ModalShell } from '@/components/common/modal-shell';
import { linksConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';

export function LinkDialog() {
  const panel = useRoomStore((state) => state.panel);
  const selected = useRoomStore((state) => state.selectedLinkId);
  const closePanel = useRoomStore((state) => state.closePanel);
  const link = linksConfig.find((item) => item.id === selected);
  return (
    <ModalShell
      open={panel === 'link' && link !== undefined}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
      title={link?.title ?? '链接详情'}
      description="网站信息与访问入口"
      size="compact"
    >
      {link === undefined ? null : <LinkDetailCard link={link} />}
    </ModalShell>
  );
}
