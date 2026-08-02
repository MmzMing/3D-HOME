import { ProfileCard } from '@/components/cards/profile-card';
import { ModalShell } from '@/components/common/modal-shell';
import { profileConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';

export function ProfileDialog() {
  const panel = useRoomStore((state) => state.panel);
  const closePanel = useRoomStore((state) => state.closePanel);

  return (
    <ModalShell
      open={panel === 'profile'}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
      title="个人资料"
      description="关于我"
    >
      <ProfileCard profile={profileConfig} />
    </ModalShell>
  );
}
