import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { sceneFont, siteRecordsConfig } from '@/config';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { FeatheredGlow } from '@/scene/effects/glow-effects';
import { InteractionProxy, LineBox, LinePlane, LineSphere } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function Door() {
  const panel = useRef<Group>(null);
  const open = useRoomStore((state) => state.objectState.doorOpen);
  const theme = useRoomStore((state) => state.theme);
  const interaction = useRoomInteraction('door');
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = useReducedMotion();
  const doorwayGlow =
    theme === 'dark' && open
      ? {
          color: '#fff4c7',
          intensity: 3.1,
          lineWidth: 1.7,
          opacity: 0.9,
          scale: 1.012,
        }
      : undefined;

  useFrame((_, delta) => {
    if (panel.current === null) return;
    const target = open ? -1.15 : 0;
    panel.current.rotation.y += (target - panel.current.rotation.y) * Math.min(1, delta * 5);
    if (Math.abs(target - panel.current.rotation.y) > 0.002) invalidate();
  });

  return (
    <group position={[6.65, 0, -8.28]} {...interaction.bind}>
      <LineBox args={[0.14, 4.7, 0.34]} glow={doorwayGlow} position={[0.07, 2.35, 0]} />
      <LineBox args={[0.14, 4.7, 0.34]} glow={doorwayGlow} position={[2.21, 2.35, 0]} />
      <LineBox args={[2.28, 0.14, 0.34]} glow={doorwayGlow} position={[1.14, 4.63, 0]} />
      <LineBox args={[2.28, 0.1, 0.48]} glow={doorwayGlow} position={[1.14, 0.05, 0.12]} />
      <Text
        anchorX="center"
        anchorY="middle"
        color={theme === 'light' ? '#000000' : '#f3f4f6'}
        font={sceneFont}
        fontSize={0.22}
        position={[1.14, 4.98, 0.15]}
      >
        {siteRecordsConfig.copyright}
      </Text>

      <group ref={panel} position={[0.17, 0.12, 0.1]}>
        <LineBox
          args={[1.94, 4.38, 0.12]}
          glow={doorwayGlow}
          position={[0.97, 2.19, 0.08]}
          hovered={interaction.hovered}
        />
        <LinePlane args={[1.46, 1.36]} glow={doorwayGlow} position={[0.97, 3.24, 0.15]} />
        <LinePlane args={[1.46, 1.52]} glow={doorwayGlow} position={[0.97, 1.24, 0.15]} />
        <LineSphere
          args={[0.1, 16, 12]}
          glow={doorwayGlow}
          position={[1.7, 2.23, 0.2]}
          scale={[1, 0.86, 0.64]}
          accent={open ? 'active' : undefined}
        />
      </group>
      <FeatheredGlow
        active={theme === 'dark' && open}
        color="#fff4c7"
        intensity={4.1}
        opacity={0.58}
        position={[1.14, 2.32, -0.045]}
        reducedMotion={reducedMotion}
        scale={[2.02, 4.42, 1]}
      />
      <InteractionProxy args={[2.5, 4.95, 0.9]} position={[1.14, 2.4, 0.12]} />
    </group>
  );
}
