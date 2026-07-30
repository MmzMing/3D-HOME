import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function AirConditioner() {
  const airflow = useRef<(Group | null)[]>([]);
  const on = useRoomStore((state) => state.objectState.airConditionerOn);
  const interaction = useRoomInteraction('air-conditioner');
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  const invalidate = useThree((state) => state.invalidate);

  useFrame((state) => {
    if (!on) return;
    airflow.current.forEach((stream, index) => {
      if (stream === null) return;
      const progress = (state.clock.elapsedTime * 0.55 + index * 0.19) % 1;
      stream.position.y = -progress * 0.72;
      stream.position.z = progress * 0.34;
    });
    invalidate();
  });

  return (
    <group position={[-9.57, 6.2, -6.55]} rotation={[0, Math.PI / 2, 0]} {...interaction.bind}>
      <LineBox args={[3.05, 0.92, 0.42]} hovered={interaction.hovered} />
      <LineBox
        args={[2.72, 0.12, 0.18]}
        position={[0, -0.36, 0.25]}
        rotation={[0.25, 0, 0]}
        accent={on ? 'active' : undefined}
      />
      <group visible={on} position={[0, -0.42, 0.28]}>
        {[-1.05, -0.52, 0, 0.52, 1.05].map((x, index) => (
          <group
            key={x}
            ref={(node) => {
              airflow.current[index] = node;
            }}
          >
            <Line
              points={[
                [x, 0, 0],
                [x + (index % 2 === 0 ? -0.1 : 0.1), -0.28, 0.28],
                [x, -0.58, 0.58],
              ]}
              color={color}
              lineWidth={0.9}
            />
          </group>
        ))}
      </group>
      <LineBox
        args={[0.13, 0.13, 0.04]}
        position={[1.17, 0.18, 0.24]}
        accent={on ? 'active' : undefined}
      />
      <InteractionProxy args={[3.35, 1.35, 1.05]} position={[0, -0.05, 0.18]} />
    </group>
  );
}
