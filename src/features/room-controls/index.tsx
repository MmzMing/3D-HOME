import { Armchair, BookOpen, Home, ListTree, Monitor, Volume2, VolumeX } from 'lucide-react';
import * as Popover from 'radix-ui/popover';

import { useRoomStore } from '@/stores/room-store';
import type { CameraZone } from '@/types/room';
import { activateRoomObject, roomObjects } from '@/utils/room-commands';

const zones: readonly { id: CameraZone; icon: typeof Home; label: string }[] = [
  { id: 'overview', icon: Home, label: '房间总览' },
  { id: 'workspace', icon: Monitor, label: '书桌区域' },
  { id: 'lounge', icon: Armchair, label: '休闲区域' },
];

export function RoomControls() {
  const zone = useRoomStore((state) => state.cameraZone);
  const setZone = useRoomStore((state) => state.setCameraZone);
  const sound = useRoomStore((state) => state.isSoundEnabled);
  const setSound = useRoomStore((state) => state.setSoundEnabled);
  const objectMenu = useRoomStore((state) => state.isObjectMenuOpen);
  const setObjectMenu = useRoomStore((state) => state.setObjectMenuOpen);
  return (
    <>
      <div className="room-actions">
        <button
          type="button"
          className="icon-button"
          aria-label={sound ? '关闭房间音效' : '开启房间音效'}
          title={sound ? '关闭音效' : '开启音效'}
          onClick={() => setSound(!sound)}
        >
          {sound ? (
            <Volume2 aria-hidden="true" size={20} />
          ) : (
            <VolumeX aria-hidden="true" size={20} />
          )}
        </button>
        <Popover.Root open={objectMenu} onOpenChange={setObjectMenu}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="icon-button"
              aria-label="打开物件列表"
              title="物件列表"
            >
              <ListTree aria-hidden="true" size={20} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="object-menu" align="end" sideOffset={10}>
              <header>
                <BookOpen aria-hidden="true" size={17} />
                <strong>房间物件</strong>
              </header>
              <div>
                {roomObjects.map((object) => (
                  <button
                    key={object.id}
                    type="button"
                    onClick={() => {
                      setZone(object.zone);
                      activateRoomObject(object.id);
                      setObjectMenu(false);
                    }}
                  >
                    {object.label}
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <nav className="camera-zones" aria-label="房间镜头">
        {zones.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              aria-pressed={zone === item.id}
              onClick={() => setZone(item.id)}
            >
              <Icon aria-hidden="true" size={20} />
            </button>
          );
        })}
      </nav>
    </>
  );
}
