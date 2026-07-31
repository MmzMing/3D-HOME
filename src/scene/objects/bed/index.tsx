import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Group } from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { FeatheredGlow, type GlowOutlineProps } from '@/scene/effects/glow-effects';
import {
  InteractionProxy,
  LineBox,
  LineCylinder,
  LineRoundedBox,
} from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const warmGlow: GlowOutlineProps = {
  color: '#fbbf24',
  intensity: 2.5,
  lineWidth: 1.45,
  opacity: 0.76,
  scale: 1.014,
};

function BedsideCabinet({
  active,
  hovered,
  side,
}: {
  active: boolean;
  hovered: boolean;
  side: -1 | 1;
}) {
  const reducedMotion = useReducedMotion();
  const theme = useRoomStore((state) => state.theme);
  const lampGlow = theme === 'dark' && active ? warmGlow : undefined;

  return (
    <group position={[side * 2.96, 0, -2.34]}>
      <LineRoundedBox args={[0.82, 0.68, 0.94]} position={[0, 0.64, 0]} radius={0.08} />
      <LineRoundedBox args={[0.7, 0.28, 0.055]} position={[0, 0.73, 0.49]} radius={0.025} />
      <LineCylinder
        args={[0.045, 0.045, 0.08, 12]}
        position={[0, 0.73, 0.56]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      {[-0.28, 0.28].flatMap((x) =>
        [-0.31, 0.31].map((z) => (
          <LineBox
            key={`${String(x)}-${String(z)}`}
            args={[0.07, 0.22, 0.07]}
            position={[x, 0.2, z]}
          />
        )),
      )}

      <LineCylinder args={[0.23, 0.23, 0.07, 18]} position={[0, 1.04, -0.02]} />
      <LineCylinder args={[0.045, 0.045, 0.58, 12]} position={[0, 1.35, -0.02]} />
      <LineCylinder
        accent={active ? 'warm' : undefined}
        args={[0.29, 0.2, 0.35, 18]}
        glow={lampGlow}
        hovered={hovered}
        position={[0, 1.72, -0.02]}
      />
      <FeatheredGlow
        active={active}
        color="#fbbf24"
        geometry="cone"
        intensity={1.3}
        opacity={theme === 'dark' ? 0.13 : 0.075}
        position={[0, 1.1, 0.06]}
        reducedMotion={reducedMotion}
        scale={[0.32, 0.46, 0.32]}
      />
    </group>
  );
}

function UpholsteredHeadboard({ active, hovered }: { active: boolean; hovered: boolean }) {
  const theme = useRoomStore((state) => state.theme);
  const seamGlow = theme === 'dark' && active ? warmGlow : undefined;

  return (
    <group>
      <LineRoundedBox args={[4.92, 2.34, 0.38]} position={[0, 1.62, -2.93]} radius={0.18} />
      <LineRoundedBox args={[4.55, 1.8, 0.16]} position={[0, 1.67, -2.69]} radius={0.14} />
      {[-1.5, -0.5, 0.5, 1.5].map((x) => (
        <LineRoundedBox
          key={x}
          accent={active ? 'warm' : undefined}
          args={[0.055, 1.48, 0.045]}
          glow={seamGlow}
          hovered={hovered}
          position={[x, 1.68, -2.58]}
          radius={0.02}
        />
      ))}
      <LineRoundedBox args={[4.66, 0.1, 0.18]} position={[0, 2.79, -2.78]} radius={0.04} />
    </group>
  );
}

function PillowSet({ pillowRef }: { pillowRef: React.RefObject<Group | null> }) {
  return (
    <group ref={pillowRef} position={[0, 0, 0]}>
      <LineRoundedBox
        args={[1.75, 0.32, 0.98]}
        position={[-1.03, 1.48, -1.76]}
        radius={0.18}
        rotation={[0.025, -0.08, 0.02]}
      />
      <LineRoundedBox
        args={[1.75, 0.32, 0.98]}
        position={[1.03, 1.48, -1.76]}
        radius={0.18}
        rotation={[0.025, 0.08, -0.02]}
      />
      <LineRoundedBox
        args={[1.18, 0.38, 0.72]}
        position={[0, 1.62, -1.37]}
        radius={0.16}
        rotation={[0.02, 0, 0]}
      />
    </group>
  );
}

export function Bed() {
  const quilt = useRef<Group>(null);
  const pillows = useRef<Group>(null);
  const motionStartedAt = useRef(0);
  const folded = useRoomStore((state) => state.objectState.quiltFolded);
  const theme = useRoomStore((state) => state.theme);
  const interaction = useRoomInteraction('bed');
  const reducedMotion = useReducedMotion();
  const invalidate = useThree((state) => state.invalidate);
  const beddingGlow =
    theme === 'dark' && (folded || interaction.hovered)
      ? {
          color: folded ? '#fbbf24' : '#67e8f9',
          intensity: 1.9,
          lineWidth: 1.3,
          opacity: 0.58,
          scale: 1.01,
        }
      : undefined;

  useEffect(() => {
    motionStartedAt.current = performance.now();
    invalidate();
  }, [folded, invalidate]);

  useFrame((_, delta) => {
    if (quilt.current === null || pillows.current === null) return;

    const amount = reducedMotion ? 1 : 1 - Math.exp(-delta * 6.2);
    const targetY = folded ? 1.51 : 1.37;
    const targetZ = folded ? 1.86 : 0.72;
    const targetScaleY = folded ? 1.3 : 1;
    const targetScaleZ = folded ? 0.36 : 1;
    const targetRotationX = folded ? -0.045 : 0.012;

    quilt.current.position.y += (targetY - quilt.current.position.y) * amount;
    quilt.current.position.z += (targetZ - quilt.current.position.z) * amount;
    quilt.current.scale.y += (targetScaleY - quilt.current.scale.y) * amount;
    quilt.current.scale.z += (targetScaleZ - quilt.current.scale.z) * amount;
    quilt.current.rotation.x += (targetRotationX - quilt.current.rotation.x) * amount;

    const age = (performance.now() - motionStartedAt.current) / 1000;
    const bounce =
      reducedMotion || age >= 0.68 ? 0 : Math.sin(age * Math.PI * 4.4) * 0.085 * (1 - age / 0.68);
    const pillowTargetY = folded ? 0.075 : 0;
    const pillowTargetZ = folded ? -0.08 : 0;
    pillows.current.position.y += (pillowTargetY + bounce - pillows.current.position.y) * amount;
    pillows.current.position.z += (pillowTargetZ - pillows.current.position.z) * amount;

    const moving =
      Math.abs(targetY - quilt.current.position.y) > 0.002 ||
      Math.abs(targetZ - quilt.current.position.z) > 0.002 ||
      Math.abs(targetScaleZ - quilt.current.scale.z) > 0.002 ||
      Math.abs(pillowTargetY - pillows.current.position.y) > 0.002 ||
      age < 0.68;
    if (moving) invalidate();
  });

  return (
    <group position={[6.8, 0, 5.05]} rotation={[0, -Math.PI / 2, 0]}>
      <UpholsteredHeadboard active={folded} hovered={interaction.hovered} />

      <LineRoundedBox args={[4.96, 0.34, 6.08]} position={[0, 0.5, 0]} radius={0.12} />
      <LineRoundedBox args={[4.2, 0.3, 5.24]} position={[0, 0.2, 0.08]} radius={0.08} />
      <LineRoundedBox args={[4.58, 0.5, 5.78]} position={[0, 0.9, 0.02]} radius={0.2} />
      <LineRoundedBox args={[4.45, 0.13, 5.65]} position={[0, 1.22, 0.04]} radius={0.08} />

      <group ref={quilt} position={[0, 1.37, 0.72]} rotation={[0.012, 0, 0]}>
        <LineRoundedBox
          accent={folded || interaction.hovered ? 'active' : undefined}
          args={[4.3, 0.16, 3.78]}
          glow={beddingGlow}
          hovered={interaction.hovered}
          radius={0.16}
        />
        <LineRoundedBox
          accent={folded ? 'warm' : undefined}
          args={[4.38, 0.075, 0.82]}
          position={[0, 0.12, 0.86]}
          radius={0.08}
        />
        {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => (
          <LineBox key={x} args={[0.025, 0.02, 3.42]} position={[x, 0.105, 0]} />
        ))}
      </group>

      <PillowSet pillowRef={pillows} />
      <BedsideCabinet active={folded} hovered={interaction.hovered} side={-1} />
      <BedsideCabinet active={folded} hovered={interaction.hovered} side={1} />

      <group {...interaction.bind}>
        <InteractionProxy args={[4.7, 0.82, 4.45]} position={[0, 1.38, 0.62]} />
      </group>
    </group>
  );
}
