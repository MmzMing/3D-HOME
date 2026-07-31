import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, type ShaderMaterial } from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const portraitImage = '/assets/images/profile/home1.webp';

const rainbowVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rainbowFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  vec3 hsv2rgb(vec3 color) {
    vec3 channels = clamp(abs(mod(color.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    channels = channels * channels * (3.0 - 2.0 * channels);
    return color.z * mix(vec3(1.0), channels, color.y);
  }

  float perimeterProgress(vec2 uv) {
    const float width = 1.62;
    const float height = 1.32;
    const float perimeter = 5.88;
    float bottom = uv.y;
    float right = 1.0 - uv.x;
    float top = 1.0 - uv.y;
    float left = uv.x;

    if (bottom <= right && bottom <= top && bottom <= left) {
      return uv.x * width / perimeter;
    }
    if (right <= top && right <= left) {
      return (width + uv.y * height) / perimeter;
    }
    if (top <= left) {
      return (width + height + (1.0 - uv.x) * width) / perimeter;
    }
    return (width * 2.0 + height + (1.0 - uv.y) * height) / perimeter;
  }

  void main() {
    float edgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float border = 1.0 - smoothstep(0.025, 0.075, edgeDistance);
    if (border < 0.001) discard;

    float progress = perimeterProgress(vUv);
    float phase = progress - uTime * 0.09;
    float iridescence = sin((progress * 3.0 - uTime * 0.12) * 6.28318530718) * 0.045;
    float hue = fract(progress * 1.35 - uTime * 0.085 + iridescence);
    vec3 rainbow = hsv2rgb(vec3(hue, 0.76, 1.0));

    float primaryWave = 0.5 + 0.5 * cos(phase * 6.28318530718);
    float secondaryWave = 0.5 + 0.5 * cos((progress - uTime * 0.055 + 0.42) * 6.28318530718);
    float primaryGlint = pow(primaryWave, 42.0);
    float secondaryGlint = pow(secondaryWave, 64.0);
    float intensity = 2.7 + primaryGlint * 4.2 + secondaryGlint * 2.4;
    float alpha = border * (0.72 + primaryGlint * 0.25 + secondaryGlint * 0.16);

    gl_FragColor = vec4(rainbow * intensity, alpha);
  }
`;

function RainbowFrameGlow({ reducedMotion }: { reducedMotion: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    const timeUniform = material.current?.uniforms.uTime;
    if (timeUniform !== undefined) {
      timeUniform.value = reducedMotion ? 0 : state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 0, 0.064]} renderOrder={21}>
      <planeGeometry args={[1.62, 1.32]} />
      <shaderMaterial
        ref={material}
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={rainbowFragmentShader}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={rainbowVertexShader}
      />
    </mesh>
  );
}

export function Portrait() {
  const interaction = useRoomInteraction('portrait');
  const texture = useTexture(portraitImage);
  const theme = useRoomStore((state) => state.theme);
  const reducedMotion = useReducedMotion();

  return (
    <group position={[-9.86, 3.45, 6.45]} rotation={[0, Math.PI / 2, 0]} {...interaction.bind}>
      <LineBox
        args={[1.55, 1.25, 0.09]}
        hovered={interaction.hovered}
        accent={interaction.hovered ? 'active' : undefined}
        glow={
          theme === 'dark'
            ? {
                color: '#67e8f9',
                intensity: 2.05,
                lineWidth: 1.45,
                opacity: 0.58,
                scale: 1.012,
              }
            : undefined
        }
      />
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[0.94, 0.94]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {theme === 'dark' ? <RainbowFrameGlow reducedMotion={reducedMotion} /> : null}
    </group>
  );
}
