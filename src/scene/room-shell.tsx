import { Line } from '@react-three/drei';

import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomStore } from '@/stores/room-store';

const roomWidth = 20;
const roomDepth = 17;
const wallHeight = 8.4;
const plankDepth = 0.92;

function WallFill({
  args,
  position,
}: {
  args: [number, number, number];
  position: [number, number, number];
}) {
  const fill = useRoomStore((state) => (state.theme === 'light' ? '#ffffff' : '#0b0d0f'));
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial color={fill} toneMapped={false} />
    </mesh>
  );
}

function FloorPattern() {
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  const rowCount = Math.ceil(roomDepth / plankDepth);

  return (
    <group>
      {Array.from({ length: rowCount + 1 }, (_, index) => {
        const z = -roomDepth / 2 + Math.min(index * plankDepth, roomDepth);
        return (
          <Line
            key={`plank-row-${String(index)}`}
            points={[
              [-roomWidth / 2, 0.012, z],
              [roomWidth / 2, 0.012, z],
            ]}
            color={color}
            lineWidth={0.8}
          />
        );
      })}
      {Array.from({ length: rowCount }, (_, row) => {
        const zStart = -roomDepth / 2 + row * plankDepth;
        const offset = row % 2 === 0 ? -roomWidth / 2 + 2.1 : -roomWidth / 2 + 4.2;
        return Array.from({ length: 4 }, (_, seam) => {
          const x = offset + seam * 4.2;
          return (
            <Line
              key={`plank-seam-${String(row)}-${String(seam)}`}
              points={[
                [x, 0.014, zStart],
                [x, 0.014, Math.min(zStart + plankDepth, roomDepth / 2)],
              ]}
              color={color}
              lineWidth={0.8}
            />
          );
        });
      })}
    </group>
  );
}

export function RoomShell() {
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  return (
    <group>
      <LineBox args={[roomWidth, 0.12, roomDepth]} position={[0, -0.06, 0]} />
      <FloorPattern />
      <WallFill
        args={[0.14, wallHeight, 4.42]}
        position={[-roomWidth / 2, wallHeight / 2, -6.29]}
      />
      <WallFill args={[0.14, wallHeight, 4.12]} position={[-roomWidth / 2, wallHeight / 2, 6.44]} />
      <WallFill args={[0.14, 2.82, 8.46]} position={[-roomWidth / 2, 1.41, 0.17]} />
      <WallFill args={[0.14, 1.58, 8.46]} position={[-roomWidth / 2, 7.61, 0.17]} />
      <Line
        points={[
          [-roomWidth / 2, wallHeight, -roomDepth / 2],
          [-roomWidth / 2, wallHeight, roomDepth / 2],
          [-roomWidth / 2, 0, roomDepth / 2],
        ]}
        color={color}
        lineWidth={1.6}
      />
      <Line
        points={[
          [-roomWidth / 2 + 0.07, wallHeight - 0.07, -roomDepth / 2 + 0.07],
          [-roomWidth / 2 + 0.07, wallHeight - 0.07, roomDepth / 2 - 0.07],
          [-roomWidth / 2 + 0.07, 0.14, roomDepth / 2 - 0.07],
        ]}
        color={color}
        lineWidth={1}
      />
      <Line
        points={[
          [-roomWidth / 2 + 0.07, 0.18, -roomDepth / 2 + 0.07],
          [-roomWidth / 2 + 0.07, wallHeight - 0.07, -roomDepth / 2 + 0.07],
        ]}
        color={color}
        lineWidth={1.2}
      />
      <LineBox
        args={[roomWidth, wallHeight, 0.14]}
        position={[0, wallHeight / 2, -roomDepth / 2]}
      />
      <LineBox args={[0.18, 0.34, roomDepth]} position={[-roomWidth / 2 + 0.12, 0.18, 0]} />
      <LineBox args={[roomWidth, 0.34, 0.18]} position={[0, 0.18, -roomDepth / 2 + 0.12]} />
    </group>
  );
}
