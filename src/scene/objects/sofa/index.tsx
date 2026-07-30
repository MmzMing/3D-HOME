import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const chairLength = 7.5;

export function Sofa() {
  const seat = useRef<Group>(null);
  const startedAt = useRef(0);
  const pulse = useRoomStore((state) => state.objectState.cushionPulse);
  const interaction = useRoomInteraction('sofa');
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    startedAt.current = performance.now();
    invalidate();
  }, [invalidate, pulse]);

  useFrame(() => {
    if (seat.current === null) return;
    const age = (performance.now() - startedAt.current) / 1000;
    const active = age < 0.62;
    seat.current.position.y = active ? Math.sin(age * Math.PI * 4) * 0.07 * (1 - age / 0.62) : 0;
    if (active) invalidate();
  });

  return (
    <group position={[-8.48, 0, 0.22]} rotation={[0, Math.PI / 2, 0]} {...interaction.bind}>
      <group ref={seat}>
        <LineBox
          args={[chairLength, 0.24, 1.82]}
          position={[0, 1.02, 0]}
          hovered={interaction.hovered}
        />
        <LineBox args={[chairLength - 0.34, 0.2, 0.16]} position={[0, 0.84, 0.78]} />
        <LineBox args={[chairLength - 0.34, 0.2, 0.16]} position={[0, 0.84, -0.78]} />
        {[-2.45, 0, 2.45].map((x) => (
          <LineBox key={x} args={[0.08, 0.04, 1.6]} position={[x, 1.16, 0]} />
        ))}
      </group>

      {[-3.42, 0, 3.42].flatMap((x) =>
        [-0.68, 0.68].map((z) => (
          <LineBox
            key={`${String(x)}-${String(z)}`}
            args={[0.24, 0.92, 0.24]}
            position={[x, 0.46, z]}
          />
        )),
      )}
      <LineBox args={[6.96, 0.16, 0.16]} position={[0, 0.34, 0.68]} />
      <LineBox args={[6.96, 0.16, 0.16]} position={[0, 0.34, -0.68]} />

      <LineBox
        args={[7.28, 0.24, 0.28]}
        position={[0, 2.42, -0.76]}
        hovered={interaction.hovered}
      />
      <LineBox args={[7.12, 0.18, 0.24]} position={[0, 1.3, -0.76]} />
      <LineBox args={[0.24, 1.46, 0.28]} position={[-3.5, 1.76, -0.76]} />
      <LineBox args={[0.24, 1.46, 0.28]} position={[3.5, 1.76, -0.76]} />
      {Array.from({ length: 11 }, (_, index) => (
        <LineBox key={index} args={[0.13, 0.98, 0.18]} position={[-3 + index * 0.6, 1.84, -0.75]} />
      ))}

      {[-3.5, 3.5].map((x) => (
        <group key={x}>
          <LineBox args={[0.26, 1.5, 0.3]} position={[x, 1.66, -0.68]} />
          <LineBox args={[0.26, 0.88, 0.3]} position={[x, 1.42, 0.68]} />
          <LineBox args={[0.32, 0.18, 1.62]} position={[x, 1.78, 0]} />
          {[-0.32, 0.04, 0.4].map((z) => (
            <LineBox key={z} args={[0.16, 0.58, 0.14]} position={[x, 1.42, z]} />
          ))}
        </group>
      ))}

      <InteractionProxy args={[7.9, 2.82, 2.24]} position={[0, 1.35, 0]} />
    </group>
  );
}
