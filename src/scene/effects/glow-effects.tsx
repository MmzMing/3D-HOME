import { Edges } from '@react-three/drei';
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  MathUtils,
  NormalBlending,
  type ColorRepresentation,
  type ShaderMaterial,
} from 'three';

type TransformProps = Pick<
  ThreeElements['mesh'],
  'position' | 'renderOrder' | 'rotation' | 'scale'
>;

export interface GlowOutlineProps {
  color: ColorRepresentation;
  intensity?: number;
  lineWidth?: number;
  opacity?: number;
  scale?: number;
  threshold?: number;
}

interface FeatheredGlowProps extends TransformProps {
  active: boolean;
  blendMode?: 'additive' | 'normal';
  color: ColorRepresentation;
  geometry?: 'cone' | 'plane';
  intensity?: number;
  opacity?: number;
  pulseAmplitude?: number;
  pulseSeconds?: number;
  reducedMotion?: boolean;
  shape?: 'beam' | 'moonbeam' | 'radial';
}

const glowVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uMode;
  uniform float uOpacity;
  uniform float uPulse;
  uniform float uPulseSeconds;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  float softBox(vec2 point, vec2 center, vec2 halfSize, float feather) {
    vec2 distanceToEdge = halfSize - abs(point - center);
    return smoothstep(0.0, feather, min(distanceToEdge.x, distanceToEdge.y));
  }

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float radial = 1.0 - smoothstep(0.12, 1.0, length(centered));

    float beamLength = smoothstep(0.0, 0.12, vUv.x)
      * (1.0 - smoothstep(0.52, 1.0, vUv.x));
    float beamWidth = 1.0 - smoothstep(0.38, 1.0, abs(centered.y));
    float beam = beamLength * beamWidth;

    float perspectiveWidth = mix(0.94, 1.0, vUv.x);
    float perspectiveBeam = beamLength
      * (1.0 - smoothstep(perspectiveWidth - 0.16, perspectiveWidth, abs(centered.y)));
    float sofaShadow = softBox(vWorldPosition.xz, vec2(-8.48, 0.22), vec2(0.94, 3.78), 0.12);
    float tableShadow = softBox(vWorldPosition.xz, vec2(-5.52, 0.22), vec2(0.96, 2.34), 0.1);
    float furnitureShadow = max(sofaShadow, tableShadow);
    float moonbeam = perspectiveBeam * (1.0 - furnitureShadow);

    float coneLength = smoothstep(0.0, 0.16, vUv.y)
      * (1.0 - smoothstep(0.68, 1.0, vUv.y));

    float mask = radial;
    if (uMode > 2.5) mask = moonbeam;
    else if (uMode > 1.5) mask = coneLength;
    else if (uMode > 0.5) mask = beam;

    float pulse = 1.0 + sin((uTime / uPulseSeconds) * 6.28318530718) * uPulse;
    float alpha = mask * uOpacity;
    if (alpha < 0.001) discard;

    gl_FragColor = vec4(uColor * uIntensity * pulse, alpha);
  }
`;

export function GlowOutline({
  color,
  intensity = 2,
  lineWidth = 1.4,
  opacity = 0.72,
  scale = 1.01,
  threshold = 15,
}: GlowOutlineProps) {
  const hdrColor = useMemo(() => new Color(color).multiplyScalar(intensity), [color, intensity]);

  return (
    <Edges
      blending={AdditiveBlending}
      color={hdrColor}
      depthWrite={false}
      lineWidth={lineWidth}
      opacity={opacity}
      renderOrder={20}
      scale={scale}
      threshold={threshold}
      toneMapped={false}
      transparent
    />
  );
}

export function FeatheredGlow({
  active,
  blendMode = 'additive',
  color,
  geometry = 'plane',
  intensity = 1,
  opacity = 0.14,
  pulseAmplitude = 0,
  pulseSeconds = 6,
  reducedMotion = false,
  shape = 'radial',
  renderOrder = 10,
  ...transform
}: FeatheredGlowProps) {
  const invalidate = useThree((state) => state.invalidate);
  const currentOpacity = useRef(active ? opacity : 0);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
      uMode: {
        value: geometry === 'cone' ? 2 : shape === 'moonbeam' ? 3 : shape === 'beam' ? 1 : 0,
      },
      uOpacity: { value: active ? opacity : 0 },
      uPulse: { value: reducedMotion ? 0 : pulseAmplitude },
      uPulseSeconds: { value: pulseSeconds },
      uTime: { value: 0 },
    }),
    [
      active,
      color,
      geometry,
      intensity,
      opacity,
      pulseAmplitude,
      pulseSeconds,
      reducedMotion,
      shape,
    ],
  );

  useFrame((state, delta) => {
    const target = active ? opacity : 0;
    currentOpacity.current = MathUtils.damp(currentOpacity.current, target, 7, delta);
    const shader = material.current;
    if (shader !== null) {
      const opacityUniform = shader.uniforms.uOpacity;
      const timeUniform = shader.uniforms.uTime;
      if (opacityUniform !== undefined) opacityUniform.value = currentOpacity.current;
      if (timeUniform !== undefined)
        timeUniform.value = reducedMotion ? 0 : state.clock.elapsedTime;
    }
    if (Math.abs(currentOpacity.current - target) > 0.001) invalidate();
  });

  return (
    <mesh {...transform} renderOrder={renderOrder}>
      {geometry === 'cone' ? (
        <coneGeometry args={[1.2, 2.6, 32, 1, true]} />
      ) : (
        <planeGeometry args={[1, 1]} />
      )}
      <shaderMaterial
        ref={material}
        blending={blendMode === 'additive' ? AdditiveBlending : NormalBlending}
        depthWrite={false}
        fragmentShader={glowFragmentShader}
        side={DoubleSide}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={glowVertexShader}
      />
    </mesh>
  );
}
