import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';

import { InteractionProxy } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';

const dollImage = '/assets/images/profile/home2.webp';

export function ProfileDoll() {
  const animated = useRef<Group>(null);
  const [pressed, setPressed] = useState(false);
  const interaction = useRoomInteraction('profile-doll');
  const texture = useTexture(dollImage);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (animated.current === null) return;
    const target = pressed ? 0.86 : 1;
    const animation = gsap.to(animated.current.scale, {
      duration: pressed ? 0.12 : 0.4,
      ease: pressed ? 'power2.out' : 'back.out(2.2)',
      x: target,
      y: target,
      z: target,
      onUpdate: invalidate,
    });
    return () => {
      animation.kill();
    };
  }, [invalidate, pressed]);

  return (
    <group position={[0.35, 0, 0.55]} rotation={[0, 0.74, 0]}>
      <group
        ref={animated}
        {...interaction.bind}
        onPointerDown={(event) => {
          event.stopPropagation();
          setPressed(true);
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
          setPressed(false);
        }}
      >
        <mesh position={[0, 1.18, 0.025]}>
          <planeGeometry args={[2.34, 2.34]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.08} toneMapped={false} />
        </mesh>
        <InteractionProxy args={[2.42, 2.38, 0.5]} position={[0, 1.18, 0]} />
      </group>
    </group>
  );
}
