import { Line, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { sceneFont } from '@/config';
import { InteractionProxy, LineBox, LineCylinder } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { usePlayerStore } from '@/stores/player-store';
import { useRoomStore } from '@/stores/room-store';

function hornRing(radius: number) {
  return Array.from({ length: 33 }, (_, index) => {
    const angle = (index / 32) * Math.PI * 2;
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number];
  });
}

export function Gramophone() {
  const record = useRef<Group>(null);
  const notes = useRef<Group>(null);
  const interaction = useRoomInteraction('gramophone');
  const status = usePlayerStore((state) => state.status);
  const theme = useRoomStore((state) => state.theme);
  const color = theme === 'light' ? '#000000' : '#f3f4f6';
  const noteColor = theme === 'light' ? '#000000' : '#fbbf24';
  const invalidate = useThree((state) => state.invalidate);
  const playing = status === 'playing' || status === 'loading';

  useFrame((state, delta) => {
    if (record.current !== null && playing) {
      record.current.rotation.y += delta * 4.5;
      invalidate();
    }
    if (notes.current !== null && playing) {
      notes.current.position.x = 0.84 + Math.sin(state.clock.elapsedTime * 1.6) * 0.16;
      notes.current.position.y = 2.88 + ((state.clock.elapsedTime * 0.42) % 1.25);
      notes.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.8) * 0.18;
    }
  });

  return (
    <group position={[-9, 0, 7.62]} {...interaction.bind}>
      <LineBox args={[1.85, 0.16, 1.45]} position={[0, 1.22, 0]} />
      <LineBox args={[1.58, 0.72, 1.18]} position={[0, 0.8, 0]} />
      {[-0.72, 0.72].flatMap((x) =>
        [-0.54, 0.54].map((z) => (
          <LineBox key={[x, z].join('-')} args={[0.11, 0.48, 0.11]} position={[x, 0.24, z]} />
        )),
      )}
      <LineBox args={[1.5, 0.22, 1.16]} position={[0, 1.39, 0]} hovered={interaction.hovered} />
      <group ref={record} position={[-0.25, 1.54, 0.04]}>
        <LineCylinder args={[0.48, 0.48, 0.055, 30]} accent={playing ? 'warm' : undefined} />
        <LineCylinder args={[0.1, 0.1, 0.065, 18]} position={[0, 0.02, 0]} />
      </group>
      <Line
        points={[
          [0.5, 1.58, -0.34],
          [0.36, 1.65, 0.3],
          [0.1, 1.61, 0.36],
        ]}
        color={playing ? '#fbbf24' : color}
        lineWidth={1.4}
      />
      <Line
        points={[
          [0.42, 1.48, -0.35],
          [0.62, 2.04, -0.26],
        ]}
        color={color}
        lineWidth={1.4}
      />
      <LineCylinder
        args={[0.64, 0.13, 0.82, 32]}
        position={[0.83, 2.3, -0.2]}
        rotation={[0, 0, -0.72]}
        accent={playing ? 'warm' : undefined}
      />
      <group position={[1.1, 2.61, -0.2]} rotation={[0, 0, -0.72]}>
        <Line points={hornRing(0.66)} color={playing ? '#fbbf24' : color} lineWidth={1.5} />
        <Line points={hornRing(0.48)} color={color} lineWidth={1.1} />
      </group>
      <Line
        points={[
          [0.1, 1.61, 0.36],
          [0.42, 1.86, 0.14],
          [0.7, 2.01, -0.18],
        ]}
        color={playing ? '#fbbf24' : color}
        lineWidth={1.4}
      />
      <Line
        points={[
          [0.52, 1.6, -0.34],
          [0.68, 1.92, -0.22],
          [0.78, 2.03, -0.2],
        ]}
        color={color}
        lineWidth={1.1}
      />
      <group ref={notes} visible={playing} position={[0.84, 2.88, -0.08]}>
        <Text position={[-0.24, 0, 0]} font={sceneFont} fontSize={0.5} color={noteColor}>
          ♪
        </Text>
        <Text position={[0.3, 0.5, 0.04]} font={sceneFont} fontSize={0.42} color={noteColor}>
          ♫
        </Text>
        <Text position={[-0.05, 1, 0.02]} font={sceneFont} fontSize={0.36} color={noteColor}>
          ♪
        </Text>
      </group>
      <InteractionProxy args={[2.4, 3.1, 2]} position={[0, 1.35, 0]} />
    </group>
  );
}
