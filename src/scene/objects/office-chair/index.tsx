import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineBox, LineCylinder } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function OfficeChair() {
  const chair = useRef<Group>(null);
  const out = useRoomStore((state) => state.objectState.chairOut);
  const interaction = useRoomInteraction('office-chair');
  const invalidate = useThree((state) => state.invalidate);
  useFrame((_, delta) => {
    if (chair.current === null) return;
    const targetZ = out ? -3.5 : -5.18;
    const targetRotation = out ? Math.PI - 0.24 : Math.PI;
    chair.current.position.z += (targetZ - chair.current.position.z) * Math.min(1, delta * 5);
    chair.current.rotation.y +=
      (targetRotation - chair.current.rotation.y) * Math.min(1, delta * 5);
    if (Math.abs(targetZ - chair.current.position.z) > 0.002) invalidate();
  });
  return (
    <group
      ref={chair}
      position={[-1.15, 0, -5.18]}
      rotation={[0, Math.PI, 0]}
      {...interaction.bind}
    >
      <LineBox args={[1.15, 0.22, 1.1]} position={[0, 1.25, 0]} hovered={interaction.hovered} />
      <LineBox
        args={[1.15, 1.55, 0.22]}
        position={[0, 2.05, -0.43]}
        hovered={interaction.hovered}
      />
      <LineCylinder args={[0.08, 0.08, 1.05, 8]} position={[0, 0.7, 0]} />
      <LineCylinder args={[0.22, 0.22, 0.18, 12]} position={[0, 0.16, 0]} />
      {Array.from({ length: 5 }, (_, index) => (
        <group key={index} rotation={[0, (index * Math.PI * 2) / 5, 0]}>
          <LineBox args={[0.72, 0.07, 0.08]} position={[0.36, 0.14, 0]} />
          <LineCylinder
            args={[0.08, 0.08, 0.07, 10]}
            position={[0.72, 0.08, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
      ))}
      <InteractionProxy args={[1.7, 3.2, 1.8]} position={[0, 1.45, 0]} />
    </group>
  );
}
