import { Line } from '@react-three/drei';

import { LineBox, LineSphere } from '@/scene/primitives/line-shape';
import { useRoomStore } from '@/stores/room-store';

export function Mouse() {
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  return (
    <group position={[-0.96, 2.27, -5.48]} rotation={[0, -0.12, 0]}>
      <LineSphere args={[0.5, 24, 16]} position={[0, 0.04, 0]} scale={[0.42, 0.17, 0.58]} />
      <Line
        points={[
          [0, 0.125, -0.27],
          [0, 0.125, 0.04],
        ]}
        color={color}
        lineWidth={1}
      />
      <LineBox args={[0.055, 0.045, 0.13]} position={[0, 0.16, -0.09]} />
    </group>
  );
}
