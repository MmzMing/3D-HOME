import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineCylinder } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function Plant() {
  const leaves = useRef<Group>(null);
  const interaction = useRoomInteraction('plant');
  const pulse = useRoomStore((state) => state.objectState.plantPulse);
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  const invalidate = useThree((state) => state.invalidate);

  useFrame((state) => {
    if (leaves.current === null) return;
    const sway = Math.sin(state.clock.elapsedTime * 2.2 + pulse) * 0.065;
    leaves.current.rotation.z += (sway - leaves.current.rotation.z) * 0.07;
    if (Math.abs(sway - leaves.current.rotation.z) > 0.002) invalidate();
  });

  return (
    <group position={[1.75, 2.2, -6.78]} {...interaction.bind}>
      <LineCylinder
        args={[0.31, 0.23, 0.5, 12]}
        position={[0, 0.25, 0]}
        hovered={interaction.hovered}
      />
      <group ref={leaves} position={[0, 0.51, 0]}>
        {Array.from({ length: 7 }, (_, index) => {
          const angle = (index / 7) * Math.PI * 2;
          return (
            <Line
              key={index}
              points={[
                [0, 0, 0],
                [Math.cos(angle) * 0.15, 0.4, Math.sin(angle) * 0.15],
                [Math.cos(angle) * 0.46, 0.78 + (index % 2) * 0.13, Math.sin(angle) * 0.46],
              ]}
              color={interaction.hovered ? '#0e7490' : color}
              lineWidth={1.2}
            />
          );
        })}
      </group>
      <InteractionProxy args={[1, 1.45, 1]} position={[0, 0.55, 0]} />
    </group>
  );
}
