import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function Bed() {
  const quilt = useRef<Group>(null);
  const folded = useRoomStore((state) => state.objectState.quiltFolded);
  const interaction = useRoomInteraction('bed');
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (quilt.current === null) return;
    const amount = Math.min(1, delta * 6);
    const targetScaleY = folded ? 4.6 : 1;
    const targetScaleZ = folded ? 0.32 : 1;
    const targetY = folded ? 1.57 : 1.34;
    const targetZ = folded ? 2.08 : 1.18;
    quilt.current.scale.y += (targetScaleY - quilt.current.scale.y) * amount;
    quilt.current.scale.z += (targetScaleZ - quilt.current.scale.z) * amount;
    quilt.current.position.y += (targetY - quilt.current.position.y) * amount;
    quilt.current.position.z += (targetZ - quilt.current.position.z) * amount;
    if (
      Math.abs(targetScaleY - quilt.current.scale.y) > 0.002 ||
      Math.abs(targetScaleZ - quilt.current.scale.z) > 0.002 ||
      Math.abs(targetY - quilt.current.position.y) > 0.002 ||
      Math.abs(targetZ - quilt.current.position.z) > 0.002
    ) {
      invalidate();
    }
  });

  return (
    <group position={[6.8, 0, 5.98]} rotation={[0, -Math.PI / 2, 0]}>
      <LineBox args={[4.72, 0.56, 6.2]} position={[0, 0.58, 0]} />
      <LineBox args={[4.52, 0.46, 5.92]} position={[0, 1.03, 0.06]} />
      <LineBox args={[4.88, 2.02, 0.28]} position={[0, 1.48, -2.98]} />
      <group ref={quilt} position={[0, 1.34, 1.18]} {...interaction.bind}>
        <LineBox
          args={[4.3, 0.13, 3.28]}
          accent={folded || interaction.hovered ? 'active' : undefined}
          position={[0, 0, 0]}
        />
      </group>
      <LineBox
        args={[1.78, 0.3, 0.92]}
        position={[-1.05, 1.38, -1.75]}
        rotation={[0.02, -0.08, 0]}
      />
      <LineBox args={[1.78, 0.3, 0.92]} position={[1.05, 1.38, -1.75]} rotation={[0.02, 0.08, 0]} />
    </group>
  );
}
