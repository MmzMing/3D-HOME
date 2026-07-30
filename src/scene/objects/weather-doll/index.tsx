import { Edges, Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineCylinder, LineSphere } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function WeatherDoll() {
  const doll = useRef<Group>(null);
  const startedAt = useRef(0);
  const interaction = useRoomInteraction('weather-doll');
  const pulse = useRoomStore((state) => state.objectState.weatherDollPulse);
  const theme = useRoomStore((state) => state.theme);
  const color = theme === 'light' ? '#000000' : '#f3f4f6';
  const outline = interaction.hovered ? (theme === 'light' ? '#0e7490' : '#67e8f9') : color;
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (pulse === 0) return;
    startedAt.current = performance.now();
    invalidate();
  }, [invalidate, pulse]);

  useFrame(() => {
    if (doll.current === null) return;
    if (startedAt.current === 0) return;
    const age = (performance.now() - startedAt.current) / 1000;
    const strength = Math.max(0, 1 - age / 2.8);
    doll.current.rotation.z = Math.sin(age * 6.5) * 0.2 * strength;
    doll.current.rotation.y = Math.sin(age * 3.2) * 0.12 * strength;
    if (strength > 0) invalidate();
  });

  return (
    <group position={[4.82, 5.95, -8.2]} {...interaction.bind}>
      <Line
        points={[
          [0, 1.45, 0],
          [0, 0.72, 0],
        ]}
        color={color}
        lineWidth={1.1}
      />
      <group ref={doll}>
        <LineSphere args={[0.36, 20, 14]} position={[0, 0.45, 0]} hovered={interaction.hovered} />
        <LineCylinder args={[0.22, 0.22, 0.08, 18]} position={[0, 0.12, 0]} accent="warm" />
        <mesh position={[0, -0.34, 0]}>
          <coneGeometry args={[0.58, 1.02, 10, 1, false]} />
          <meshBasicMaterial color={theme === 'light' ? '#ffffff' : '#0b0d0f'} toneMapped={false} />
          <Edges color={outline} threshold={1} />
        </mesh>
        <Line
          points={[
            [-0.12, 0.53, 0.33],
            [-0.08, 0.53, 0.35],
          ]}
          color={color}
          lineWidth={1.4}
        />
        <Line
          points={[
            [0.08, 0.53, 0.35],
            [0.12, 0.53, 0.33],
          ]}
          color={color}
          lineWidth={1.4}
        />
        <Line
          points={[
            [-0.1, 0.37, 0.34],
            [0, 0.31, 0.36],
            [0.1, 0.37, 0.34],
          ]}
          color={color}
          lineWidth={1.1}
        />
        <Line
          points={[
            [0, -0.85, 0],
            [0, -1.18, 0],
          ]}
          color={color}
          lineWidth={1.1}
        />
        <LineSphere args={[0.1, 16, 10]} position={[0, -1.28, 0]} accent="active" />
      </group>
      <InteractionProxy args={[1.45, 2.8, 1.3]} position={[0, 0.1, 0]} />
    </group>
  );
}
