import { X } from 'lucide-react';
import * as Dialog from 'radix-ui/dialog';
import type { ReactNode } from 'react';

interface ModalShellProps {
  children: ReactNode;
  description: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  size?: 'compact' | 'wide';
  title: string;
}

export function ModalShell({
  children,
  description,
  onOpenChange,
  open,
  size = 'wide',
  title,
}: ModalShellProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" data-size={size}>
          <header className="dialog-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="关闭窗口" title="关闭">
              <X aria-hidden="true" size={20} />
            </Dialog.Close>
          </header>
          <div className="dialog-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
