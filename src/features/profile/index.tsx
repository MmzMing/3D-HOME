import { X } from 'lucide-react';
import * as Dialog from 'radix-ui/dialog';

import { ProfileCard } from '@/components/cards/profile-card';
import { ModalShell } from '@/components/common/modal-shell';
import { profileConfig } from '@/config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useRoomStore } from '@/stores/room-store';

export function ProfileDialog() {
  const panel = useRoomStore((state) => state.panel);
  const closePanel = useRoomStore((state) => state.closePanel);
  const isDesktop = useMediaQuery('(min-width: 720px)');
  const isOpen = panel === 'profile';

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    closePanel();
  };

  if (isDesktop) {
    return <ProfileShowcase open={isOpen} onOpenChange={handleOpenChange} />;
  }

  return (
    <ModalShell open={isOpen} onOpenChange={handleOpenChange} title="个人资料" description="关于我">
      <ProfileCard profile={profileConfig} />
    </ModalShell>
  );
}

function ProfileShowcase({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog.Root modal={false} open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content className="profile-showcase" data-testid="profile-showcase">
          <header className="profile-showcase-header">
            <div>
              <Dialog.Title>个人资料</Dialog.Title>
              <Dialog.Description>关于我</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="关闭个人资料" title="关闭">
              <X aria-hidden="true" size={20} />
            </Dialog.Close>
          </header>
          <div className="profile-showcase-body">
            <ProfileCard profile={profileConfig} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
