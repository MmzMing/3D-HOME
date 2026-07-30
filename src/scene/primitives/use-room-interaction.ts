import { useCursor } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useState } from 'react';

import { useRoomStore } from '@/stores/room-store';
import type { RoomObjectId } from '@/types/room';
import { activateRoomObject } from '@/utils/room-commands';

export function useRoomInteraction(id: RoomObjectId, action?: () => void) {
  const [hovered, setHovered] = useState(false);
  const setHoveredObject = useRoomStore((state) => state.setHoveredObject);
  useCursor(hovered);

  return {
    hovered,
    bind: {
      onClick: (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        (action ?? (() => activateRoomObject(id)))();
      },
      onPointerOut: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(false);
        setHoveredObject(null);
      },
      onPointerOver: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
        setHoveredObject(id);
      },
    },
  };
}
