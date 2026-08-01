import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, Vector2, type Group } from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { GlowOutlineProps } from '@/scene/effects/glow-effects';
import {
  InteractionProxy,
  LineBox,
  LineCylinder,
  LineLathe,
  LineSphere,
} from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const topProfile = [
  new Vector2(0, 0),
  new Vector2(0.065, 0.12),
  new Vector2(0.14, 0.21),
  new Vector2(0.28, 0.3),
  new Vector2(0.3, 0.34),
  new Vector2(0.21, 0.39),
  new Vector2(0.1, 0.43),
  new Vector2(0.067, 0.51),
  new Vector2(0.052, 0.7),
  new Vector2(0.024, 0.78),
  new Vector2(0, 0.78),
];

function GameController({ glow }: { glow: GlowOutlineProps | undefined }) {
  return (
    <group position={[-0.52, 1.24, 0.08]} rotation={[0, -0.12, 0]}>
      <LineSphere args={[0.42, 20, 14]} glow={glow} scale={[1.15, 0.18, 0.58]} />
      <LineBox
        args={[0.32, 0.16, 0.55]}
        glow={glow}
        position={[-0.34, -0.04, 0.2]}
        rotation={[0, -0.28, -0.16]}
      />
      <LineBox
        args={[0.32, 0.16, 0.55]}
        glow={glow}
        position={[0.34, -0.04, 0.2]}
        rotation={[0, 0.28, 0.16]}
      />
      <LineBox args={[0.28, 0.035, 0.07]} glow={glow} position={[-0.2, 0.19, -0.04]} />
      <LineBox args={[0.07, 0.035, 0.28]} glow={glow} position={[-0.2, 0.19, -0.04]} />
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle) => (
        <LineCylinder
          key={angle}
          args={[0.035, 0.035, 0.025, 12]}
          glow={glow}
          position={[0.22 + Math.cos(angle) * 0.1, 0.2, -0.04 + Math.sin(angle) * 0.1]}
        />
      ))}
      <LineCylinder args={[0.08, 0.09, 0.045, 16]} glow={glow} position={[-0.06, 0.2, 0.08]} />
      <LineCylinder args={[0.08, 0.09, 0.045, 16]} glow={glow} position={[0.08, 0.2, 0.08]} />
    </group>
  );
}

function SpinningTop({ glow }: { glow: GlowOutlineProps | undefined }) {
  const tilt = useRef<Group>(null);
  const spinner = useRef<Group>(null);
  const ambientStrength = useRef(0);
  const clickStrength = useRef(0);
  const ambientPhase = useRef(0);
  const clickPhase = useRef(0);
  const nextAmbientAt = useRef(9);
  const pulse = useRoomStore((state) => state.objectState.topPulse);
  const theme = useRoomStore((state) => state.theme);
  const interaction = useRoomInteraction('spinning-top');
  const reducedMotion = useReducedMotion();
  const lastPulse = useRef(pulse);

  useFrame((state, delta) => {
    const spinningGroup = spinner.current;
    const tiltGroup = tilt.current;
    if (spinningGroup === null || tiltGroup === null) return;

    const speed = reducedMotion ? 1.2 : 4.8;
    spinningGroup.rotation.y = (spinningGroup.rotation.y + delta * speed) % (Math.PI * 2);

    if (pulse !== lastPulse.current) {
      lastPulse.current = pulse;
      if (!reducedMotion) {
        clickStrength.current = Math.min(1.35, clickStrength.current + 1);
        clickPhase.current += Math.PI * 0.37;
      }
    }

    if (reducedMotion) {
      ambientStrength.current = 0;
      clickStrength.current = 0;
      tiltGroup.rotation.x = MathUtils.damp(tiltGroup.rotation.x, 0, 10, delta);
      tiltGroup.rotation.z = MathUtils.damp(tiltGroup.rotation.z, 0, 10, delta);
      return;
    }

    const elapsed = state.clock.elapsedTime;
    if (elapsed >= nextAmbientAt.current) {
      ambientStrength.current = 1;
      ambientPhase.current += Math.PI * 0.43;
      nextAmbientAt.current = elapsed + 7 + Math.random() * 5;
    }

    ambientStrength.current = MathUtils.damp(ambientStrength.current, 0, 2.2, delta);
    clickStrength.current = MathUtils.damp(clickStrength.current, 0, 3, delta);
    ambientPhase.current += delta * 5.2;
    clickPhase.current += delta * 11;

    const targetX =
      Math.cos(ambientPhase.current) * ambientStrength.current * 0.03 +
      Math.cos(clickPhase.current) * clickStrength.current * 0.245;
    const targetZ =
      Math.sin(ambientPhase.current) * ambientStrength.current * 0.03 +
      Math.sin(clickPhase.current) * clickStrength.current * 0.245;
    tiltGroup.rotation.x = MathUtils.damp(tiltGroup.rotation.x, targetX, 18, delta);
    tiltGroup.rotation.z = MathUtils.damp(tiltGroup.rotation.z, targetZ, 18, delta);
  });

  const markerColor = glow === undefined ? (theme === 'light' ? '#000000' : '#f3f4f6') : '#8fd3ff';

  return (
    <group position={[0.62, 1.13, 0.42]} {...interaction.bind}>
      <group ref={tilt}>
        <group ref={spinner}>
          <LineLathe args={[topProfile, 48]} glow={glow} hovered={interaction.hovered} />
          <Line
            color={markerColor}
            lineWidth={1.8}
            points={[
              [0.075, 0.432, 0],
              [0.265, 0.365, 0],
            ]}
          />
        </group>
        <InteractionProxy args={[0.76, 0.9, 0.76]} position={[0, 0.4, 0]} />
      </group>
    </group>
  );
}

export function CoffeeTable() {
  const curtainsOpen = useRoomStore((state) => state.objectState.curtainsOpen);
  const theme = useRoomStore((state) => state.theme);
  const moonGlow =
    theme === 'dark' && curtainsOpen
      ? {
          color: '#8fd3ff',
          intensity: 1.8,
          lineWidth: 1.35,
          opacity: 0.58,
          scale: 1.008,
        }
      : undefined;
  return (
    <group position={[-5.52, 0, 0.22]} rotation={[0, Math.PI / 2, 0]}>
      <LineBox args={[4.6, 0.22, 1.86]} glow={moonGlow} position={[0, 1.02, 0]} />
      <LineBox args={[4.18, 0.24, 0.16]} position={[0, 0.82, -0.74]} />
      <LineBox args={[4.18, 0.24, 0.16]} position={[0, 0.82, 0.74]} />
      <LineBox args={[0.16, 0.24, 1.48]} position={[-2.09, 0.82, 0]} />
      <LineBox args={[0.16, 0.24, 1.48]} position={[2.09, 0.82, 0]} />
      {[-1.96, 1.96].flatMap((x) =>
        [-0.68, 0.68].map((z) => (
          <LineBox
            key={`${String(x)}-${String(z)}`}
            args={[0.22, 0.84, 0.22]}
            position={[x, 0.42, z]}
          />
        )),
      )}
      <LineBox args={[3.82, 0.12, 1.32]} position={[0, 0.34, 0]} />
      <LineBox args={[3.98, 0.12, 0.12]} position={[0, 0.2, -0.62]} />
      <LineBox args={[3.98, 0.12, 0.12]} position={[0, 0.2, 0.62]} />
      <GameController glow={moonGlow} />
      <SpinningTop glow={moonGlow} />
    </group>
  );
}
