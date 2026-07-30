import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineBox, LinePlane, LineSphere } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function Door() {
  const panel = useRef<Group>(null);
  const open = useRoomStore((state) => state.objectState.doorOpen);
  const theme = useRoomStore((state) => state.theme);
  const interaction = useRoomInteraction('door');
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (panel.current === null) return;
    const target = open ? -1.15 : 0;
    panel.current.rotation.y += (target - panel.current.rotation.y) * Math.min(1, delta * 5);
    if (Math.abs(target - panel.current.rotation.y) > 0.002) invalidate();
  });

  return (
    <group position={[6.65, 0, -8.28]} {...interaction.bind}>
      <mesh position={[1.14, 2.32, -0.04]} visible={open}>
        <planeGeometry args={[2.02, 4.42]} />
        <meshBasicMaterial color={theme === 'light' ? '#000000' : '#f3f4f6'} toneMapped={false} />
      </mesh>

      <LineBox args={[0.14, 4.7, 0.34]} position={[0.07, 2.35, 0]} />
      <LineBox args={[0.14, 4.7, 0.34]} position={[2.21, 2.35, 0]} />
      <LineBox args={[2.28, 0.14, 0.34]} position={[1.14, 4.63, 0]} />
      <LineBox args={[2.28, 0.1, 0.48]} position={[1.14, 0.05, 0.12]} />

      <group ref={panel} position={[0.17, 0.12, 0.1]}>
        <LineBox
          args={[1.94, 4.38, 0.12]}
          position={[0.97, 2.19, 0.08]}
          hovered={interaction.hovered}
        />
        <LinePlane args={[1.46, 1.36]} position={[0.97, 3.24, 0.15]} />
        <LinePlane args={[1.46, 1.52]} position={[0.97, 1.24, 0.15]} />
        <LineSphere
          args={[0.1, 16, 12]}
          position={[1.7, 2.23, 0.2]}
          scale={[1, 0.86, 0.64]}
          accent={open ? 'active' : undefined}
        />
      </group>
      <InteractionProxy args={[2.5, 4.95, 0.9]} position={[1.14, 2.4, 0.12]} />
    </group>
  );
}
