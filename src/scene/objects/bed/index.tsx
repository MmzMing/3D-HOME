import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils, type Group } from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { FeatheredGlow, type GlowOutlineProps } from '@/scene/effects/glow-effects';
import {
  InteractionProxy,
  LineBox,
  LineCylinder,
  LineRoundedBox,
  LineSphere,
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

const quiltBaseY = 1.37;
const quiltCenterZ = 0.72;
const quiltPanelLength = 1.26;
const quiltPanelWidth = 2.15;
const quiltThickness = 0.11;

const lampRibs = Array.from({ length: 6 }, (_, index) => {
  const angle = (index / 6) * Math.PI * 2;
  return {
    bottom: [Math.cos(angle) * 0.39, 1.57, Math.sin(angle) * 0.39 - 0.02] as [
      number,
      number,
      number,
    ],
    top: [Math.cos(angle) * 0.22, 1.99, Math.sin(angle) * 0.22 - 0.02] as [number, number, number],
  };
});

type LampInteraction = ReturnType<typeof useRoomInteraction>;

function BedsideLamp({ interaction, on }: { interaction: LampInteraction; on: boolean }) {
  const glowGroup = useRef<Group>(null);
  const theme = useRoomStore((state) => state.theme);
  const reducedMotion = useReducedMotion();
  const invalidate = useThree((state) => state.invalidate);
  const lampGlow = theme === 'dark' && on ? warmGlow : undefined;
  const lightOpacity = theme === 'dark' ? 0.14 : 0.055;
  const surfaceOpacity = theme === 'dark' ? 0.07 : 0.022;

  useFrame((state, delta) => {
    const group = glowGroup.current;
    if (group === null) return;

    const pulse =
      on && !reducedMotion
        ? 1 + Math.sin((state.clock.elapsedTime / 5.2) * Math.PI * 2) * 0.045
        : 1;
    const smoothing = Math.min(1, delta * 8);
    group.scale.x += (pulse - group.scale.x) * smoothing;
    group.scale.y += (pulse - group.scale.y) * smoothing;
    group.scale.z += (pulse - group.scale.z) * smoothing;

    if (
      (on && !reducedMotion) ||
      Math.abs(group.scale.x - pulse) > 0.001 ||
      Math.abs(group.scale.y - pulse) > 0.001 ||
      Math.abs(group.scale.z - pulse) > 0.001
    ) {
      invalidate();
    }
  });

  return (
    <group {...interaction.bind}>
      <group ref={glowGroup}>
        <LineSphere
          accent={on ? 'warm' : undefined}
          args={[0.14, 16, 10]}
          glow={lampGlow}
          hovered={interaction.hovered}
          position={[0, 1.69, -0.02]}
        />
        <FeatheredGlow
          active={on}
          color="#fbbf24"
          geometry="cone"
          intensity={1.28}
          opacity={lightOpacity}
          position={[0, 1.3, 0.06]}
          reducedMotion={reducedMotion}
          scale={[0.36, 0.255, 0.36]}
        />
        <FeatheredGlow
          active={on}
          color="#fbbf24"
          geometry="plane"
          intensity={1.05}
          opacity={surfaceOpacity}
          position={[0, 1.005, 0.08]}
          reducedMotion={reducedMotion}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.58, 0.46, 1]}
        />
      </group>

      <LineCylinder
        args={[0.27, 0.27, 0.08, 20]}
        glow={lampGlow}
        hovered={interaction.hovered}
        position={[0, 1.04, -0.02]}
      />
      <LineCylinder
        accent={on ? 'warm' : undefined}
        args={[0.18, 0.22, 0.06, 20]}
        glow={lampGlow}
        hovered={interaction.hovered}
        position={[0, 1.12, -0.02]}
      />
      <LineCylinder
        accent={on ? 'warm' : undefined}
        args={[0.055, 0.055, 0.54, 12]}
        glow={lampGlow}
        hovered={interaction.hovered}
        position={[0, 1.4, -0.02]}
      />
      <LineCylinder
        accent={on ? 'warm' : undefined}
        args={[0.1, 0.1, 0.045, 16]}
        glow={lampGlow}
        hovered={interaction.hovered}
        position={[0, 1.64, -0.02]}
      />

      <LineCylinder
        accent={on ? 'warm' : undefined}
        args={[0.4, 0.4, 0.045, 24]}
        glow={lampGlow}
        hovered={interaction.hovered}
        position={[0, 1.57, -0.02]}
      />
      <LineCylinder
        accent={on ? 'warm' : undefined}
        args={[0.22, 0.22, 0.045, 24]}
        glow={lampGlow}
        hovered={interaction.hovered}
        position={[0, 2, -0.02]}
      />
      <LineCylinder
        accent={on ? 'warm' : undefined}
        args={[0.22, 0.4, 0.42, 24]}
        glow={lampGlow}
        hovered={interaction.hovered}
        position={[0, 1.785, -0.02]}
      />
      {lampRibs.map((rib, index) => (
        <Line
          key={`lamp-rib-${String(index)}`}
          color={on ? '#fbbf24' : theme === 'light' ? '#000000' : '#f3f4f6'}
          lineWidth={on ? 1.15 : 0.85}
          points={[rib.bottom, rib.top]}
          toneMapped={false}
        />
      ))}

      <InteractionProxy args={[0.98, 1.28, 0.98]} position={[0, 1.56, -0.02]} />
    </group>
  );
}

function BedsideCabinet({
  lampInteraction,
  lampOn,
  side,
}: {
  lampInteraction: LampInteraction;
  lampOn: boolean;
  side: -1 | 1;
}) {
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
      <BedsideLamp interaction={lampInteraction} on={lampOn} />
    </group>
  );
}

function UpholsteredHeadboard() {
  return (
    <group>
      <LineRoundedBox args={[4.92, 2.34, 0.38]} position={[0, 1.62, -2.93]} radius={0.18} />
      <LineRoundedBox args={[4.55, 1.8, 0.16]} position={[0, 1.67, -2.69]} radius={0.14} />
      {[-1.5, -0.5, 0.5, 1.5].map((x) => (
        <LineRoundedBox
          key={x}
          args={[0.055, 1.48, 0.045]}
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

function QuiltPanel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <LineBox args={[quiltPanelWidth - 0.025, quiltThickness, quiltPanelLength - 0.025]} />
      <LineBox
        args={[quiltPanelWidth - 0.22, 0.018, 0.028]}
        position={[0, quiltThickness / 2 + 0.012, 0]}
      />
    </group>
  );
}

function QuiltColumn({
  baseY,
  firstFoldRef,
  secondFoldRef,
  x,
}: {
  baseY: number;
  firstFoldRef: React.RefObject<Group | null>;
  secondFoldRef: React.RefObject<Group | null>;
  x: number;
}) {
  const halfLength = quiltPanelLength / 2;
  const secondHingeZ = quiltCenterZ + halfLength;

  return (
    <>
      <QuiltPanel position={[x, baseY, quiltCenterZ + quiltPanelLength]} />
      <group ref={secondFoldRef} position={[0, baseY + quiltThickness / 2, secondHingeZ]}>
        <QuiltPanel position={[x, -quiltThickness / 2, -halfLength]} />
        <group ref={firstFoldRef} position={[0, 0, -quiltPanelLength]}>
          <QuiltPanel position={[x, -quiltThickness / 2, -halfLength]} />
        </group>
      </group>
    </>
  );
}

export function Bed() {
  const foldProgress = useRef(0);
  const leftColumnFold = useRef<Group>(null);
  const leftFirstFold = useRef<Group>(null);
  const leftSecondFold = useRef<Group>(null);
  const rightFirstFold = useRef<Group>(null);
  const rightSecondFold = useRef<Group>(null);
  const pillows = useRef<Group>(null);
  const folded = useRoomStore((state) => state.objectState.quiltFolded);
  const bedsideLampOn = useRoomStore((state) => state.objectState.bedsideLampOn);
  const interaction = useRoomInteraction('bed');
  const lampInteraction = useRoomInteraction('bedside-lamp');
  const reducedMotion = useReducedMotion();
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    invalidate();
  }, [folded, invalidate]);

  useFrame((_, delta) => {
    const leftColumn = leftColumnFold.current;
    const leftFirst = leftFirstFold.current;
    const leftSecond = leftSecondFold.current;
    const rightFirst = rightFirstFold.current;
    const rightSecond = rightSecondFold.current;
    const pillowGroup = pillows.current;
    if (
      leftColumn === null ||
      leftFirst === null ||
      leftSecond === null ||
      rightFirst === null ||
      rightSecond === null ||
      pillowGroup === null
    ) {
      return;
    }

    const target = folded ? 1 : 0;
    const previous = foldProgress.current;
    const step = reducedMotion ? 1 : delta / 1.75;
    foldProgress.current =
      target > previous ? Math.min(target, previous + step) : Math.max(target, previous - step);

    const progress = foldProgress.current;
    const firstStage = MathUtils.smootherstep(progress, 0, 0.38);
    const secondStage = MathUtils.smootherstep(progress, 0.32, 0.72);
    const thirdStage = MathUtils.smootherstep(progress, 0.66, 1);

    leftFirst.rotation.x = Math.PI * firstStage;
    rightFirst.rotation.x = Math.PI * firstStage;
    leftSecond.rotation.x = Math.PI * secondStage;
    rightSecond.rotation.x = Math.PI * secondStage;
    leftSecond.position.y = -quiltThickness / 2 + quiltThickness * secondStage;
    rightSecond.position.y = quiltBaseY + quiltThickness / 2 + quiltThickness * secondStage;

    leftColumn.position.y = quiltBaseY + quiltThickness + quiltThickness * 3 * thirdStage;
    leftColumn.rotation.z = -Math.PI * thirdStage;

    const pillowLift = Math.sin(progress * Math.PI) * 0.035;
    pillowGroup.position.y = pillowLift;
    pillowGroup.position.z = -progress * 0.035;

    const moving = Math.abs(target - foldProgress.current) > 0.001;
    if (moving) invalidate();
  });

  return (
    <group position={[6.8, 0, 5.05]} rotation={[0, -Math.PI / 2, 0]}>
      <UpholsteredHeadboard />

      <LineRoundedBox args={[4.96, 0.34, 6.08]} position={[0, 0.5, 0]} radius={0.12} />
      <LineRoundedBox args={[4.2, 0.3, 5.24]} position={[0, 0.2, 0.08]} radius={0.08} />
      <LineRoundedBox args={[4.58, 0.5, 5.78]} position={[0, 0.9, 0.02]} radius={0.2} />
      <LineRoundedBox args={[4.45, 0.13, 5.65]} position={[0, 1.22, 0.04]} radius={0.08} />

      <group
        ref={leftColumnFold}
        position={[0, quiltBaseY + quiltThickness, 0]}
        rotation={[0, 0, 0]}
      >
        <QuiltColumn
          baseY={-quiltThickness}
          firstFoldRef={leftFirstFold}
          secondFoldRef={leftSecondFold}
          x={-quiltPanelWidth / 2}
        />
      </group>
      <QuiltColumn
        baseY={quiltBaseY}
        firstFoldRef={rightFirstFold}
        secondFoldRef={rightSecondFold}
        x={quiltPanelWidth / 2}
      />

      <PillowSet pillowRef={pillows} />
      <BedsideCabinet lampInteraction={lampInteraction} lampOn={bedsideLampOn} side={-1} />
      <BedsideCabinet lampInteraction={lampInteraction} lampOn={bedsideLampOn} side={1} />

      <group {...interaction.bind}>
        <InteractionProxy args={[4.7, 0.82, 4.45]} position={[0, 1.38, 0.62]} />
      </group>
    </group>
  );
}
