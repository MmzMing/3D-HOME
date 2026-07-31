import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineCylinder } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function WallClock() {
  const hour = useRef<Group>(null);
  const minute = useRef<Group>(null);
  const second = useRef<Group>(null);
  const pendulum = useRef<Group>(null);
  const interaction = useRoomInteraction('clock');
  const running = useRoomStore((state) => state.objectState.clockRunning);
  const theme = useRoomStore((state) => state.theme);
  const color = theme === 'light' ? '#000000' : '#f3f4f6';
  const invalidate = useThree((state) => state.invalidate);

  useFrame((state) => {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    if (hour.current !== null) hour.current.rotation.z = -(hours / 12) * Math.PI * 2;
    if (minute.current !== null) minute.current.rotation.z = -(minutes / 60) * Math.PI * 2;
    if (second.current !== null) second.current.rotation.z = -(seconds / 60) * Math.PI * 2;
    if (pendulum.current !== null)
      pendulum.current.rotation.z = running
        ? Math.sin(state.clock.elapsedTime * Math.PI) * 0.28
        : 0;
    if (running) invalidate();
  });

  return (
    <group position={[2.7, 5.35, -8.26]} {...interaction.bind}>
      <LineCylinder
        args={[0.72, 0.72, 0.08, 32]}
        glow={
          theme === 'dark'
            ? {
                color: '#67e8f9',
                intensity: 2.05,
                lineWidth: 1.45,
                opacity: 0.7,
                scale: 1.012,
              }
            : undefined
        }
        rotation={[Math.PI / 2, 0, 0]}
        hovered={interaction.hovered}
      />
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <Line
            key={index}
            points={[
              [Math.sin(angle) * 0.57, Math.cos(angle) * 0.57, 0.06],
              [Math.sin(angle) * 0.67, Math.cos(angle) * 0.67, 0.06],
            ]}
            color={color}
          />
        );
      })}
      <group ref={hour}>
        <Line
          points={[
            [0, -0.04, 0.08],
            [0, 0.34, 0.08],
          ]}
          color={color}
          lineWidth={1.6}
        />
      </group>
      <group ref={minute}>
        <Line
          points={[
            [0, -0.06, 0.09],
            [0, 0.5, 0.09],
          ]}
          color={color}
          lineWidth={1.4}
        />
      </group>
      <group ref={second}>
        <Line
          points={[
            [0, -0.12, 0.1],
            [0, 0.57, 0.1],
          ]}
          color="#0e7490"
          lineWidth={1}
        />
      </group>
      <group ref={pendulum} position={[0, -0.72, 0]}>
        <Line
          points={[
            [0, 0, 0],
            [0, -1.02, 0],
          ]}
          color={color}
        />
        <LineCylinder
          args={[0.16, 0.16, 0.05, 18]}
          position={[0, -1.1, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          accent={running ? 'active' : undefined}
        />
      </group>
      <InteractionProxy args={[1.8, 3.1, 0.7]} position={[0, -0.65, 0]} />
    </group>
  );
}
