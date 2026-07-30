import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineBox, LinePlane } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function Desk() {
  const drawer = useRef<Group>(null);
  const open = useRoomStore((state) => state.objectState.drawerOpen);
  const interaction = useRoomInteraction('desk-drawer');
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (drawer.current === null) return;
    const target = open ? 0.62 : 0;
    drawer.current.position.z += (target - drawer.current.position.z) * Math.min(1, delta * 7);
    if (Math.abs(target - drawer.current.position.z) > 0.002) invalidate();
  });

  return (
    <group position={[-0.9, 0, -6.55]}>
      <LineBox args={[7.8, 0.2, 2.25]} position={[0, 2.08, 0]} />
      <LineBox args={[1.48, 1.92, 1.82]} position={[-3.02, 1.02, -0.08]} />
      <LineBox args={[1.48, 1.92, 1.82]} position={[3.02, 1.02, -0.08]} />
      <LinePlane args={[1.16, 1.45]} position={[3.02, 1.02, 0.84]} />
      <LineBox args={[0.3, 0.06, 0.06]} position={[3.02, 1.05, 0.9]} />
      <LineBox args={[4.15, 0.16, 0.16]} position={[0, 0.72, -0.9]} />

      {[0.42, 0.96].map((y) => (
        <group key={y} position={[-3.02, y, 0.84]}>
          <LinePlane args={[1.16, 0.42]} />
          <LineBox args={[0.34, 0.055, 0.055]} position={[0, 0, 0.06]} />
        </group>
      ))}

      <group {...interaction.bind}>
        <group ref={drawer} position={[-3.02, 1.5, 0]}>
          <LineBox args={[1.18, 0.46, 1.66]} hovered={interaction.hovered} />
          <LinePlane args={[1.16, 0.42]} position={[0, 0, 0.85]} />
          <LineBox
            args={[0.34, 0.055, 0.055]}
            position={[0, 0, 0.91]}
            hovered={interaction.hovered}
          />
        </group>
        <InteractionProxy args={[1.5, 0.72, 1.25]} position={[-3.02, 1.5, 0.48]} />
      </group>
    </group>
  );
}
