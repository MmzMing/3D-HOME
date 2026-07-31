import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import { Color } from 'three';

import { InteractionProxy, LineSphere } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const topOutline = [
  [0, 0.13, -0.58],
  [-0.24, 0.12, -0.54],
  [-0.38, 0.1, -0.41],
  [-0.45, 0.08, -0.18],
  [-0.46, 0.06, 0.27],
  [-0.39, 0.05, 0.47],
  [-0.25, 0.04, 0.58],
  [0, 0.035, 0.62],
  [0.25, 0.04, 0.58],
  [0.39, 0.05, 0.47],
  [0.46, 0.06, 0.27],
  [0.45, 0.08, -0.18],
  [0.38, 0.1, -0.41],
  [0.24, 0.12, -0.54],
  [0, 0.13, -0.58],
] as [number, number, number][];

const lowerOutline = topOutline.map(([x, , z]) => [x, -0.015, z] as [number, number, number]);

const buttonCurve = [
  [-0.43, 0.12, -0.08],
  [-0.31, 0.125, 0],
  [-0.16, 0.13, 0.05],
  [0, 0.132, 0.07],
  [0.16, 0.13, 0.05],
  [0.31, 0.125, 0],
  [0.43, 0.12, -0.08],
] as [number, number, number][];

export function Mouse() {
  const interaction = useRoomInteraction('mouse');
  const theme = useRoomStore((state) => state.theme);
  const lampOn = useRoomStore((state) => state.objectState.deskLampOn);
  const warmLineColor = useMemo(() => new Color('#ffd166').multiplyScalar(2.15), []);
  const warmGlow =
    theme === 'dark' && lampOn
      ? {
          color: '#ffd166',
          intensity: 2.15,
          lineWidth: 1.35,
          opacity: 0.72,
          scale: 1.012,
        }
      : undefined;
  const color = theme === 'light' ? '#000000' : '#f3f4f6';
  const activeColor = theme === 'light' ? '#0e7490' : '#67e8f9';
  const lineColor = interaction.hovered
    ? activeColor
    : warmGlow === undefined
      ? color
      : warmLineColor;

  return (
    <group position={[-0.82, 2.27, -5.92]} rotation={[0, 0.08, 0]} {...interaction.bind}>
      <group scale={0.3}>
        <Line
          points={topOutline}
          color={lineColor}
          lineWidth={interaction.hovered ? 1.8 : 1.35}
          toneMapped={false}
        />
        <Line points={lowerOutline} color={lineColor} lineWidth={1} toneMapped={false} />
        <Line points={buttonCurve} color={lineColor} lineWidth={1.25} toneMapped={false} />
        <Line
          points={[
            [0, 0.145, -0.57],
            [0, 0.145, -0.39],
          ]}
          color={lineColor}
          lineWidth={1.25}
          toneMapped={false}
        />
        <Line
          points={[
            [0, 0.145, -0.17],
            [0, 0.14, 0.06],
          ]}
          color={lineColor}
          lineWidth={1.25}
          toneMapped={false}
        />
        <LineSphere
          args={[0.5, 18, 12]}
          position={[0, 0.15, -0.28]}
          scale={[0.13, 0.07, 0.22]}
          hovered={interaction.hovered}
          accent={interaction.hovered ? 'active' : undefined}
          glow={warmGlow}
        />
        {[-0.4, 0.4].map((x) => (
          <Line
            key={x}
            points={[
              [x, -0.01, -0.16],
              [x, 0.08, -0.16],
            ]}
            color={lineColor}
            lineWidth={1}
            toneMapped={false}
          />
        ))}
      </group>
      <InteractionProxy args={[0.72, 0.28, 0.9]} position={[0, 0.04, 0]} />
    </group>
  );
}
