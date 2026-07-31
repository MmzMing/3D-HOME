import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, MathUtils, type Group, type ShaderMaterial } from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { FeatheredGlow } from '@/scene/effects/glow-effects';
import { InteractionProxy, LineBox, LinePlane } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const sashWidth = 4.22;
const sashHeight = 3.48;

const dustVertexShader = /* glsl */ `
  uniform float uPointSize;
  uniform float uTime;
  attribute float aPhase;
  varying float vBrightness;

  void main() {
    vec3 animated = position;
    animated.x += cos(uTime * 0.38 + aPhase * 1.7) * 0.08;
    animated.y += sin(uTime * 0.52 + aPhase) * 0.18;
    animated.z += sin(uTime * 0.31 + aPhase * 2.3) * 0.11;
    vBrightness = 0.72 + sin(uTime * 0.42 + aPhase * 3.1) * 0.2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(animated, 1.0);
    gl_PointSize = uPointSize;
  }
`;

const dustFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vBrightness;

  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    float alpha = (1.0 - smoothstep(0.12, 0.5, distanceToCenter)) * uOpacity * vBrightness;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor * 1.25, alpha);
  }
`;

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.17 + salt * 37.41) * 43758.5453;
  return value - Math.floor(value);
}

function MoonDust({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const mobile = useThree((state) => state.size.width < 720);
  const material = useRef<ShaderMaterial>(null);
  const count = mobile ? 28 : 56;
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      const progress = (index + 0.5) / count;
      const spread = 0.45 + progress * 2.65;
      positions[index * 3] = -9.25 + progress * 6.35 + (seeded(index, 1) - 0.5) * 0.45;
      positions[index * 3 + 1] = 4.3 * (1 - progress) + 0.25 + (seeded(index, 2) - 0.5) * 0.9;
      positions[index * 3 + 2] = -0.1 - progress * 1.45 + (seeded(index, 3) - 0.5) * spread;
      phases[index] = seeded(index, 4) * Math.PI * 2;
    }
    return { phases, positions };
  }, [count]);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color('#d7f2ff') },
      uOpacity: { value: 0.48 },
      uPointSize: { value: mobile ? 2.15 : 2.45 },
      uTime: { value: 0 },
    }),
    [mobile],
  );

  useFrame((state) => {
    const shader = material.current;
    if (!active || shader === null) return;
    const timeUniform = shader.uniforms.uTime;
    if (timeUniform !== undefined) timeUniform.value = reducedMotion ? 0 : state.clock.elapsedTime;
  });

  if (!active) return null;
  return (
    <points renderOrder={14}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[particles.phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={dustFragmentShader}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={dustVertexShader}
      />
    </points>
  );
}

export function Window() {
  const leftSash = useRef<Group>(null);
  const rightSash = useRef<Group>(null);
  const leftCurtain = useRef<Group>(null);
  const rightCurtain = useRef<Group>(null);
  const open = useRoomStore((state) => state.objectState.windowOpen);
  const curtainsOpen = useRoomStore((state) => state.objectState.curtainsOpen);
  const theme = useRoomStore((state) => state.theme);
  const interaction = useRoomInteraction('window');
  const curtainInteraction = useRoomInteraction('curtains');
  const invalidate = useThree((state) => state.invalidate);
  const color = theme === 'light' ? '#000000' : '#f3f4f6';
  const reducedMotion = useReducedMotion();
  const moonlightBoost = open ? 1.15 : 1;
  const moonlightActive = theme === 'dark' && curtainsOpen;
  const windowGlow = moonlightActive
    ? {
        color: '#8fd3ff',
        intensity: 2.05 * moonlightBoost,
        lineWidth: 1.35,
        opacity: 0.68,
        scale: 1.01,
      }
    : undefined;
  const curtainGlow =
    theme === 'dark'
      ? {
          color: '#8fd3ff',
          intensity: curtainsOpen ? 1.65 : 1.85,
          lineWidth: 1.25,
          opacity: curtainsOpen ? 0.48 : 0.58,
          scale: 1.012,
        }
      : undefined;

  useFrame((_, delta) => {
    const smoothing = Math.min(1, delta * 5);
    if (leftSash.current !== null) {
      const target = open ? 0.68 : 0;
      leftSash.current.rotation.y += (target - leftSash.current.rotation.y) * smoothing;
      if (Math.abs(target - leftSash.current.rotation.y) > 0.002) invalidate();
    }
    if (rightSash.current !== null) {
      const target = open ? -0.68 : 0;
      rightSash.current.rotation.y += (target - rightSash.current.rotation.y) * smoothing;
      if (Math.abs(target - rightSash.current.rotation.y) > 0.002) invalidate();
    }

    const curtainScale = curtainsOpen ? 0.38 : 1.86;
    const curtainPosition = curtainsOpen ? 4.12 : 2.05;
    if (leftCurtain.current !== null) {
      leftCurtain.current.position.x = MathUtils.damp(
        leftCurtain.current.position.x,
        -curtainPosition,
        7,
        delta,
      );
      leftCurtain.current.scale.x = MathUtils.damp(
        leftCurtain.current.scale.x,
        curtainScale,
        7,
        delta,
      );
      if (Math.abs(leftCurtain.current.scale.x - curtainScale) > 0.002) invalidate();
    }
    if (rightCurtain.current !== null) {
      rightCurtain.current.position.x = MathUtils.damp(
        rightCurtain.current.position.x,
        curtainPosition,
        7,
        delta,
      );
      rightCurtain.current.scale.x = MathUtils.damp(
        rightCurtain.current.scale.x,
        curtainScale,
        7,
        delta,
      );
      if (Math.abs(rightCurtain.current.scale.x - curtainScale) > 0.002) invalidate();
    }
  });

  return (
    <>
      <group position={[-9.88, 4.82, 0.15]} rotation={[0, Math.PI / 2, 0]} scale={[0.86, 1, 1]}>
        <group {...interaction.bind}>
          <LineBox
            args={[8.8, 0.18, 0.18]}
            glow={windowGlow}
            position={[0, 1.92, 0.6]}
            hovered={interaction.hovered}
          />
          <LineBox
            args={[8.8, 0.18, 0.18]}
            glow={windowGlow}
            position={[0, -1.92, 0.6]}
            hovered={interaction.hovered}
          />
          <LineBox
            args={[0.18, 4.58, 0.18]}
            glow={windowGlow}
            position={[-4.49, 0.14, 0.6]}
            hovered={interaction.hovered}
          />
          <LineBox
            args={[0.18, 4.58, 0.18]}
            glow={windowGlow}
            position={[4.49, 0.14, 0.6]}
            hovered={interaction.hovered}
          />
          <LineBox
            args={[8.98, 0.16, 0.18]}
            position={[0, -2.08, 0.6]}
            hovered={interaction.hovered}
          />

          <group ref={leftSash} position={[-4.36, 0, 0.58]}>
            <LinePlane
              args={[sashWidth, 3.32]}
              glow={windowGlow}
              position={[2.14, 0, 0]}
              hovered={interaction.hovered}
            />
            <LineBox
              args={[sashWidth, 0.1, 0.14]}
              glow={windowGlow}
              position={[2.14, 1.72, 0.04]}
            />
            <LineBox
              args={[sashWidth, 0.1, 0.14]}
              glow={windowGlow}
              position={[2.14, -1.72, 0.04]}
            />
            <LineBox args={[0.1, sashHeight, 0.14]} glow={windowGlow} position={[0.05, 0, 0.04]} />
            <LineBox args={[0.1, sashHeight, 0.14]} glow={windowGlow} position={[4.23, 0, 0.04]} />
            <LineBox args={[0.08, 3.18, 0.08]} glow={windowGlow} position={[2.14, 0, 0.08]} />
            <LineBox args={[4.02, 0.08, 0.08]} glow={windowGlow} position={[2.14, 0, 0.08]} />
          </group>

          <group ref={rightSash} position={[4.36, 0, 0.58]}>
            <LinePlane
              args={[sashWidth, 3.32]}
              glow={windowGlow}
              position={[-2.14, 0, 0]}
              hovered={interaction.hovered}
            />
            <LineBox
              args={[sashWidth, 0.1, 0.14]}
              glow={windowGlow}
              position={[-2.14, 1.72, 0.04]}
            />
            <LineBox
              args={[sashWidth, 0.1, 0.14]}
              glow={windowGlow}
              position={[-2.14, -1.72, 0.04]}
            />
            <LineBox args={[0.1, sashHeight, 0.14]} glow={windowGlow} position={[-0.05, 0, 0.04]} />
            <LineBox args={[0.1, sashHeight, 0.14]} glow={windowGlow} position={[-4.23, 0, 0.04]} />
            <LineBox args={[0.08, 3.18, 0.08]} glow={windowGlow} position={[-2.14, 0, 0.08]} />
            <LineBox args={[4.02, 0.08, 0.08]} glow={windowGlow} position={[-2.14, 0, 0.08]} />
          </group>

          <InteractionProxy args={[9.35, 4.35, 0.72]} />
        </group>

        <group {...curtainInteraction.bind}>
          <LineBox args={[8.8, 0.3, 0.18]} glow={curtainGlow} position={[0, 2.28, 0.6]} />
          <group ref={leftCurtain} position={[-4.12, 0.08, 0.6]} scale={[0.38, 1, 1]}>
            <LineBox
              args={[2.16, 3.86, 0.1]}
              accent={curtainsOpen ? undefined : 'active'}
              glow={curtainGlow}
              hovered={curtainInteraction.hovered}
            />
            {[-0.72, -0.24, 0.24, 0.72].map((x) => (
              <Line
                key={x}
                points={[
                  [x, 1.82, 0.08],
                  [x + 0.08, -1.82, 0.08],
                ]}
                color={color}
                lineWidth={0.8}
              />
            ))}
            <InteractionProxy args={[2.4, 4.05, 0.55]} />
          </group>
          <group ref={rightCurtain} position={[4.12, 0.08, 0.6]} scale={[0.38, 1, 1]}>
            <LineBox
              args={[2.16, 3.86, 0.1]}
              accent={curtainsOpen ? undefined : 'active'}
              glow={curtainGlow}
              hovered={curtainInteraction.hovered}
            />
            {[-0.72, -0.24, 0.24, 0.72].map((x) => (
              <Line
                key={x}
                points={[
                  [x, 1.82, 0.08],
                  [x - 0.08, -1.82, 0.08],
                ]}
                color={color}
                lineWidth={0.8}
              />
            ))}
            <InteractionProxy args={[2.4, 4.05, 0.55]} />
          </group>
        </group>
      </group>

      <FeatheredGlow
        active={moonlightActive}
        color="#8fd3ff"
        intensity={1.62 * moonlightBoost}
        opacity={0.115}
        position={[-6.2, 0.035, -0.9]}
        reducedMotion={reducedMotion}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[7.4, 7.8, 1]}
        shape="moonbeam"
      />
      <MoonDust active={moonlightActive} reducedMotion={reducedMotion} />
    </>
  );
}
