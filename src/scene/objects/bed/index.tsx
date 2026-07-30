import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Group } from 'three';

import { InteractionProxy, LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function Bed() {
  const pillow = useRef<Group>(null);
  const startedAt = useRef(0);
  const pulse = useRoomStore((state) => state.objectState.pillowPulse);
  const interaction = useRoomInteraction('bed');
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    startedAt.current = performance.now();
    invalidate();
  }, [invalidate, pulse]);

  useFrame(() => {
    if (pillow.current === null) return;
    const age = (performance.now() - startedAt.current) / 1000;
    const active = age < 0.75;
    pillow.current.position.y = active
      ? 1.38 + Math.sin(age * Math.PI * 3) * 0.12 * (1 - age / 0.75)
      : 1.38;
    if (active) invalidate();
  });

  return (
    <group position={[6.8, 0, 5.98]} rotation={[0, -Math.PI / 2, 0]} {...interaction.bind}>
      <LineBox args={[4.72, 0.56, 6.2]} position={[0, 0.58, 0]} />
      <LineBox args={[4.52, 0.46, 5.92]} position={[0, 1.03, 0.06]} hovered={interaction.hovered} />
      <LineBox args={[4.88, 2.02, 0.28]} position={[0, 1.48, -2.98]} />
      <LineBox args={[4.3, 0.13, 3.28]} position={[0, 1.34, 1.18]} />
      <group ref={pillow} position={[-1.05, 1.38, -1.75]} rotation={[0.02, -0.08, 0]}>
        <LineBox args={[1.78, 0.3, 0.92]} accent={interaction.hovered ? 'active' : undefined} />
      </group>
      <LineBox args={[1.78, 0.3, 0.92]} position={[1.05, 1.38, -1.75]} rotation={[0.02, 0.08, 0]} />
      <InteractionProxy args={[5.05, 2.95, 6.55]} position={[0, 1.25, 0]} />
    </group>
  );
}
