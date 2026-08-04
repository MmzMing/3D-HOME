import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type ComponentRef } from 'react';
import { MathUtils } from 'three';

import { roomRevealRuntime } from '@/scene/effects/line-reveal';
import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomStore } from '@/stores/room-store';

const roomWidth = 20;
const roomDepth = 17;
const wallHeight = 8.4;
const plankDepth = 0.92;
const floorRevealEndProgress = 0.49;

type FloorLineAxis = 'x' | 'z';

interface FloorLineProps {
  points: [number, number, number][];
  axis: FloorLineAxis;
  depth: number;
  color: string;
  zStart: number;
}

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

function FloorLine({ points, axis, depth, color, zStart }: FloorLineProps) {
  const line = useRef<ComponentRef<typeof Line>>(null);

  useFrame(() => {
    const object = line.current;
    if (object === null) return;

    const progress = MathUtils.clamp(
      roomRevealRuntime.progress.current / floorRevealEndProgress,
      0,
      1,
    );
    const lineStart = 0.04 + depth * 0.76;
    const amount = MathUtils.clamp((progress - lineStart) / 0.24, 0, 1);
    const scaleAmount = Math.max(amount, 0.0001);
    object.visible = amount > 0;

    if (axis === 'x') {
      object.scale.set(scaleAmount, 1, 1);
      object.position.set((-roomWidth / 2) * (1 - amount), 0, 0);
    } else {
      object.scale.set(1, 1, scaleAmount);
      object.position.set(0, 0, zStart * (1 - amount));
    }
  });

  return <Line ref={line} points={points} color={color} lineWidth={0.8} />;
}

function FloorPattern() {
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  const rowCount = Math.ceil(roomDepth / plankDepth);

  return (
    <group userData={{ roomFloorPattern: true }}>
      {Array.from({ length: rowCount }, (_, row) => {
        const zStart = -roomDepth / 2 + row * plankDepth;
        const depth = MathUtils.clamp((zStart + roomDepth / 2) / roomDepth, 0, 1);
        const offset = row % 2 === 0 ? -roomWidth / 2 + 2.1 : -roomWidth / 2 + 4.2;
        return (
          <group key={`plank-row-${String(row)}`}>
            <FloorLine
              points={[
                [-roomWidth / 2, 0.012, zStart],
                [roomWidth / 2, 0.012, zStart],
              ]}
              axis="x"
              depth={depth}
              color={color}
              zStart={zStart}
            />
            {Array.from({ length: 4 }, (_, seam) => {
              const x = offset + seam * 4.2;
              return (
                <FloorLine
                  key={`plank-seam-${String(row)}-${String(seam)}`}
                  points={[
                    [x, 0.014, zStart],
                    [x, 0.014, Math.min(zStart + plankDepth, roomDepth / 2)],
                  ]}
                  axis="z"
                  depth={depth}
                  color={color}
                  zStart={zStart}
                />
              );
            })}
          </group>
        );
      })}
      <FloorLine
        points={[
          [-roomWidth / 2, 0.012, roomDepth / 2],
          [roomWidth / 2, 0.012, roomDepth / 2],
        ]}
        axis="x"
        depth={1}
        color={color}
        zStart={roomDepth / 2}
      />
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
