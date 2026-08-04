import { X } from 'lucide-react';
import * as Dialog from 'radix-ui/dialog';
import type { ReactNode } from 'react';

export type ObjectShowcaseLayout =
  | 'bookshelf-split'
  | 'door-bottom'
  | 'keyboard-stack'
  | 'laptop-split'
  | 'portrait-split'
  | 'weather-split';

interface ObjectShowcaseProps {
  children: ReactNode;
  description: string;
  dismissOnOutside?: boolean;
  layout: ObjectShowcaseLayout;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}

export function ObjectShowcase({
  children,
  description,
  dismissOnOutside = true,
  layout,
  onOpenChange,
  open,
  title,
}: ObjectShowcaseProps) {
  const dismissHandlers = dismissOnOutside
    ? {}
    : {
        onEscapeKeyDown: (event: KeyboardEvent) => event.preventDefault(),
        onPointerDownOutside: (event: Event) => event.preventDefault(),
      };

  return (
    <Dialog.Root modal={false} open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content {...dismissHandlers} className="object-showcase" data-layout={layout}>
          <header className="object-showcase-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="关闭窗口" title="关闭">
              <X aria-hidden="true" size={20} />
            </Dialog.Close>
          </header>
          <div className="object-showcase-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
