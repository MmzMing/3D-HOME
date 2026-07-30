import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineBox, LineCylinder } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function DeskFan() {
  const head = useRef<Group>(null);
  const blades = useRef<Group>(null);
  const speed = useRoomStore((state) => state.objectState.fanSpeed);
  const interaction = useRoomInteraction('fan');
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  const invalidate = useThree((state) => state.invalidate);

  useFrame((state, delta) => {
    if (blades.current !== null && speed > 0) {
      blades.current.rotation.z += delta * (speed === 1 ? 5.5 : 9.5);
    }
    if (head.current !== null) {
      const target = speed > 0 ? Math.sin(state.clock.elapsedTime * 0.85) * 0.5 : 0;
      head.current.rotation.y += (target - head.current.rotation.y) * Math.min(1, delta * 2.8);
    }
    if (speed > 0) invalidate();
  });

  return (
    <group position={[-4.05, 2.2, -6.92]} {...interaction.bind}>
      <LineCylinder args={[0.3, 0.38, 0.1, 20]} position={[0, 0.05, 0]} />
      <LineCylinder args={[0.055, 0.055, 0.72, 10]} position={[0, 0.4, 0]} />
      <group ref={head} position={[0, 0.88, 0]}>
        <LineCylinder
          args={[0.52, 0.52, 0.08, 28]}
          rotation={[Math.PI / 2, 0, 0]}
          hovered={interaction.hovered}
          accent={speed > 0 ? 'active' : undefined}
        />
        <group ref={blades} position={[0, 0, 0.08]}>
          {Array.from({ length: 3 }, (_, index) => (
            <group key={index} rotation={[0, 0, (index * Math.PI * 2) / 3]}>
              <LineBox args={[0.42, 0.12, 0.035]} position={[0.22, 0, 0]} />
            </group>
          ))}
        </group>
        <LineCylinder
          args={[0.1, 0.1, 0.12, 16]}
          position={[0, 0, 0.12]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {Array.from({ length: 8 }, (_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          return (
            <Line
              key={index}
              points={[
                [0, 0, 0.16],
                [Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, 0.16],
              ]}
              color={color}
              lineWidth={0.7}
            />
          );
        })}
      </group>
      <InteractionProxy args={[1.35, 1.75, 1]} position={[0, 0.76, 0]} />
    </group>
  );
}
