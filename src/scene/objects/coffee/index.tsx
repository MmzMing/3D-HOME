import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineCylinder } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function Coffee() {
  const steam = useRef<Group>(null);
  const interaction = useRoomInteraction('coffee');
  const steaming = useRoomStore((state) => state.objectState.coffeeSteaming);
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  const invalidate = useThree((state) => state.invalidate);
  const lines = useMemo(() => [-0.08, 0.08], []);

  useFrame((state) => {
    if (steam.current !== null && steaming) {
      steam.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.6) * 0.18;
      invalidate();
    }
  });

  return (
    <group position={[-3.72, 2.2, -5.88]} {...interaction.bind}>
      <LineCylinder
        args={[0.17, 0.15, 0.34, 16]}
        position={[0, 0.17, 0]}
        hovered={interaction.hovered}
      />
      <group ref={steam} visible={steaming} position={[0, 0.35, 0]}>
        {lines.map((x) => (
          <Line
            key={x}
            points={[
              [x, 0, 0],
              [x + 0.04, 0.18, 0],
              [x - 0.02, 0.38, 0],
            ]}
            color={color}
            lineWidth={1}
          />
        ))}
      </group>
      <InteractionProxy args={[0.7, 1, 0.7]} position={[0, 0.35, 0]} />
    </group>
  );
}
