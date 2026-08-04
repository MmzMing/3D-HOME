import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils, type Group } from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { FeatheredGlow, type GlowOutlineProps } from '@/scene/effects/glow-effects';
import { InteractionProxy, LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const warmGlow: GlowOutlineProps = {
  color: '#fbbf24',
  intensity: 2.5,
  lineWidth: 1.45,
  opacity: 0.76,
  scale: 1.014,
};

const headboardSlats = [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8];
const tableLegs = [-0.34, 0.34] as const;
const quiltBaseY = 1.56;
const quiltCenterZ = 0.72;
const quiltPanelLength = 1.26;
const quiltPanelWidth = 2.15;
const quiltThickness = 0.11;

type LampInteraction = ReturnType<typeof useRoomInteraction>;

function BedsideLamp({ interaction, on }: { interaction: LampInteraction; on: boolean }) {
  const glowGroup = useRef<Group>(null);
  const theme = useRoomStore((state) => state.theme);
  const reducedMotion = useReducedMotion();
  const invalidate = useThree((state) => state.invalidate);
  const lampGlow = theme === 'dark' && on ? warmGlow : undefined;
  const lightOpacity = theme === 'dark' ? 0.14 : 0.055;
  const surfaceOpacity = theme === 'dark' ? 0.07 : 0.022;
  const lineColor = on ? '#fbbf24' : theme === 'light' ? '#000000' : '#f3f4f6';

  useFrame((state, delta) => {
    const group = glowGroup.current;
    if (group === null) return;

    const pulse =
      on && !reducedMotion
        ? 1 + Math.sin((state.clock.elapsedTime / 5.2) * Math.PI * 2) * 0.045
        : 1;
    group.scale.x = MathUtils.damp(group.scale.x, pulse, 8, delta);
    group.scale.y = MathUtils.damp(group.scale.y, pulse, 8, delta);
    group.scale.z = MathUtils.damp(group.scale.z, pulse, 8, delta);

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
        <FeatheredGlow
          active={on}
          color="#fbbf24"
          geometry="cone"
          intensity={1.28}
          opacity={lightOpacity}
          position={[0, 1.82, 0.08]}
          reducedMotion={reducedMotion}
          scale={[0.42, 0.3, 0.42]}
        />
        <FeatheredGlow
          active={on}
          color="#fbbf24"
          geometry="plane"
          intensity={1.05}
          opacity={surfaceOpacity}
          position={[0, 1.38, 0.08]}
          reducedMotion={reducedMotion}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.62, 0.5, 1]}
        />
      </group>

      <LineBox
        accent={on ? 'warm' : undefined}
        args={[0.56, 0.1, 0.38]}
        glow={lampGlow}
        hovered={interaction.hovered}
        position={[0, 1.4, 0]}
      />
      <LineBox
        accent={on ? 'warm' : undefined}
        args={[0.12, 0.58, 0.12]}
        glow={lampGlow}
        position={[0, 1.72, 0]}
      />
      <LineBox
        accent={on ? 'warm' : undefined}
        args={[0.24, 0.08, 0.2]}
        glow={lampGlow}
        position={[0, 2.03, 0]}
      />
      <Line
        color={lineColor}
        lineWidth={on ? 1.15 : 0.9}
        points={[
          [-0.42, 2.04, 0],
          [-0.28, 2.4, 0],
          [0.28, 2.4, 0],
          [0.42, 2.04, 0],
          [-0.42, 2.04, 0],
        ]}
        toneMapped={false}
      />
      <LineBox
        accent={on ? 'warm' : undefined}
        args={[0.5, 0.07, 0.22]}
        glow={lampGlow}
        position={[0, 2.4, 0]}
      />

      <InteractionProxy args={[0.9, 1.25, 0.76]} position={[0, 1.9, 0]} />
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
    <group position={[side * 3.02, 0, -2.3]}>
      <LineBox args={[0.92, 0.78, 0.84]} position={[0, 0.78, 0]} />
      <LineBox args={[1.04, 0.14, 0.96]} position={[0, 1.24, 0]} />
      <LineBox args={[0.72, 0.24, 0.05]} position={[0, 0.92, 0.44]} />
      <LineBox args={[0.17, 0.04, 0.05]} position={[0, 0.92, 0.48]} />
      <LineBox args={[0.72, 0.24, 0.05]} position={[0, 0.57, 0.44]} />
      {tableLegs.flatMap((x) =>
        tableLegs.map((z) => (
          <LineBox
            key={`${String(x)}-${String(z)}`}
            args={[0.14, 0.52, 0.14]}
            position={[x, 0.26, z]}
          />
        )),
      )}
      <BedsideLamp interaction={lampInteraction} on={lampOn} />
    </group>
  );
}

function WoodenHeadboard() {
  return (
    <group>
      <LineBox args={[0.3, 3.72, 0.3]} position={[-2.26, 1.86, -2.66]} />
      <LineBox args={[0.3, 3.72, 0.3]} position={[2.26, 1.86, -2.66]} />
      <LineBox args={[4.86, 0.3, 0.3]} position={[0, 3.56, -2.66]} />
      <LineBox args={[4.62, 0.2, 0.2]} position={[0, 1.32, -2.66]} />
      {headboardSlats.map((x) => (
        <LineBox key={x} args={[0.1, 2.18, 0.14]} position={[x, 2.42, -2.66]} />
      ))}
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

function Pillows({ pillowRef }: { pillowRef: React.RefObject<Group | null> }) {
  return (
    <group ref={pillowRef} position={[0, 0, 0]}>
      <LineBox args={[1.68, 0.22, 0.86]} position={[-1.02, 1.62, -1.9]} />
      <LineBox args={[1.68, 0.22, 0.86]} position={[1.02, 1.62, -1.9]} />
      <LineBox args={[0.14, 0.04, 0.7]} position={[-0.18, 1.75, -1.9]} />
      <LineBox args={[0.14, 0.04, 0.7]} position={[0.18, 1.75, -1.9]} />
    </group>
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
    const step = reducedMotion ? 1 : delta / 1.25;
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

    pillowGroup.position.y = Math.sin(progress * Math.PI) * 0.035;
    pillowGroup.position.z = -progress * 0.035;

    if (Math.abs(target - progress) > 0.001) invalidate();
  });

  return (
    <group position={[6.8, 0, 5.05]} rotation={[0, -Math.PI / 2, 0]}>
      <WoodenHeadboard />

      <LineBox args={[4.86, 0.38, 5.62]} position={[0, 0.72, 0]} />
      <LineBox args={[4.72, 0.44, 0.22]} position={[0, 0.82, -2.7]} />
      <LineBox args={[4.72, 0.44, 0.22]} position={[0, 0.82, 2.7]} />
      <LineBox args={[0.22, 0.44, 5.18]} position={[-2.3, 0.82, 0]} />
      <LineBox args={[0.22, 0.44, 5.18]} position={[2.3, 0.82, 0]} />

      <LineBox args={[4.48, 0.16, 5.26]} position={[0, 1.02, 0.06]} />
      <LineBox args={[4.3, 0.36, 5.02]} position={[0, 1.3, 0.08]} />
      <LineBox args={[4.12, 0.08, 4.84]} position={[0, 1.51, 0.1]} />

      <LineBox args={[0.32, 0.72, 0.32]} position={[-2.2, 0.36, -2.5]} />
      <LineBox args={[0.32, 0.72, 0.32]} position={[2.2, 0.36, -2.5]} />
      <LineBox args={[0.32, 0.72, 0.32]} position={[-2.2, 0.36, 2.5]} />
      <LineBox args={[0.32, 0.72, 0.32]} position={[2.2, 0.36, 2.5]} />

      <Pillows pillowRef={pillows} />
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

      <BedsideCabinet lampInteraction={lampInteraction} lampOn={bedsideLampOn} side={-1} />
      <BedsideCabinet lampInteraction={lampInteraction} lampOn={bedsideLampOn} side={1} />

      <group {...interaction.bind}>
        <InteractionProxy args={[4.8, 1.7, 5.2]} position={[0, 1.18, 0.18]} />
      </group>
    </group>
  );
}
