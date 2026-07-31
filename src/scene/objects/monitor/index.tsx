import { Line, Text, useCursor, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { MathUtils, type Group } from 'three';

import { linksConfig, type LinkConfig } from '@/config';
import { InteractionProxy, LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const bubbleTargets = [
  [-2.8, 2.92, 0.35],
  [-0.95, 4, 0.42],
  [0.95, 4, 0.42],
  [2.8, 2.92, 0.35],
] as const;

function LinkBubble({ index, link, open }: { index: number; link: LinkConfig; open: boolean }) {
  const bubble = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(link.image);
  const openLink = useRoomStore((state) => state.openLink);
  const theme = useRoomStore((state) => state.theme);
  const invalidate = useThree((state) => state.invalidate);
  const target = bubbleTargets[index] ?? bubbleTargets[0];
  useCursor(hovered);

  useFrame((_, delta) => {
    if (bubble.current === null) return;
    const scale = open ? 1 : 0.001;
    const x = open ? target[0] : 0;
    const y = open ? target[1] : 1.42;
    const z = open ? target[2] : 0.15;
    bubble.current.scale.setScalar(MathUtils.damp(bubble.current.scale.x, scale, 11, delta));
    bubble.current.position.x = MathUtils.damp(bubble.current.position.x, x, 9, delta);
    bubble.current.position.y = MathUtils.damp(bubble.current.position.y, y, 9, delta);
    bubble.current.position.z = MathUtils.damp(bubble.current.position.z, z, 9, delta);
    if (
      Math.abs(bubble.current.scale.x - scale) > 0.002 ||
      Math.abs(bubble.current.position.x - x) > 0.002 ||
      Math.abs(bubble.current.position.y - y) > 0.002
    ) {
      invalidate();
    }
  });

  return (
    <group
      ref={bubble}
      position={[0, 1.42, 0.15]}
      scale={0.001}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(false);
      }}
      onClick={(event) => {
        event.stopPropagation();
        openLink(link.id);
      }}
    >
      <LineBox args={[1.82, 1.04, 0.1]} hovered={hovered} accent={hovered ? 'active' : undefined} />
      <mesh position={[-0.54, 0, 0.062]}>
        <planeGeometry args={[0.54, 0.72]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      <Text
        position={[-0.12, 0.14, 0.07]}
        fontSize={0.16}
        maxWidth={0.75}
        anchorX="left"
        anchorY="middle"
        color={
          hovered
            ? theme === 'light'
              ? '#0e7490'
              : '#67e8f9'
            : theme === 'light'
              ? '#000000'
              : '#f3f4f6'
        }
      >
        {link.title}
      </Text>
      <Text
        position={[-0.12, -0.19, 0.07]}
        fontSize={0.09}
        maxWidth={0.76}
        anchorX="left"
        anchorY="middle"
        color={theme === 'light' ? '#333333' : '#abb2ba'}
      >
        点击查看
      </Text>
    </group>
  );
}

export function Monitor() {
  const interaction = useRoomInteraction('monitor');
  const linkClusterOpen = useRoomStore((state) => state.isLinkClusterOpen);
  const theme = useRoomStore((state) => state.theme);
  const lampOn = useRoomStore((state) => state.objectState.deskLampOn);
  const monitorOn = useRoomStore((state) => state.objectState.monitorOn);
  const open = linkClusterOpen && monitorOn;
  const lineColor = theme === 'light' ? '#000000' : '#f3f4f6';
  const blogCover = linksConfig.find((link) => link.id === 'blog')?.image ?? linksConfig[0]?.image;
  const coverTexture = useTexture(blogCover ?? '/assets/images/links/blog.webp');
  const riserGlow =
    theme === 'dark' && lampOn
      ? {
          color: '#ffd166',
          intensity: 2.2,
          lineWidth: 1.45,
          opacity: 0.74,
          scale: 1.012,
        }
      : undefined;

  return (
    <group position={[-2.25, 2.18, -6.95]} {...(monitorOn ? interaction.bind : {})}>
      <LineBox
        args={[3.08, 0.16, 0.82]}
        position={[0, 0.38, 0.08]}
        accent={open ? 'active' : undefined}
        glow={riserGlow}
      />
      <LineBox args={[0.14, 0.38, 0.66]} glow={riserGlow} position={[-1.22, 0.19, 0.08]} />
      <LineBox args={[0.14, 0.38, 0.66]} glow={riserGlow} position={[1.22, 0.19, 0.08]} />
      <LineBox
        args={[2.25, 1.38, 0.12]}
        position={[0, 1.42, 0]}
        hovered={monitorOn && interaction.hovered}
        accent={open ? 'active' : undefined}
        glow={
          theme === 'dark' && monitorOn
            ? {
                color: '#67e8f9',
                intensity: open ? 2.7 : 2.4,
                lineWidth: 1.6,
                opacity: open ? 0.88 : 0.78,
                scale: 1.012,
              }
            : undefined
        }
      />
      <mesh position={[0, 1.42, 0.064]}>
        <planeGeometry args={[2.05, 1.16]} />
        <meshBasicMaterial color={theme === 'dark' ? '#080a0c' : '#f4f4f4'} toneMapped={false} />
      </mesh>
      {monitorOn ? (
        <mesh position={[0, 1.42, 0.068]}>
          <planeGeometry args={[2.05, 1.16]} />
          <meshBasicMaterial map={coverTexture} toneMapped={false} />
        </mesh>
      ) : null}
      <LineBox
        args={[0.14, 0.28, 0.14]}
        position={[0, 0.62, -0.08]}
        accent={open ? 'active' : undefined}
      />
      <LineBox
        args={[0.82, 0.08, 0.42]}
        position={[0, 0.5, 0.1]}
        accent={open ? 'active' : undefined}
      />

      {open
        ? bubbleTargets.map((target, index) => (
            <Line
              key={`bubble-line-${String(index)}`}
              points={[
                [0, 1.42, 0.1],
                [target[0] * 0.72, target[1] * 0.72 + 0.3, target[2]],
              ]}
              color={lineColor}
              lineWidth={1}
            />
          ))
        : null}
      {linksConfig.slice(0, 4).map((link, index) => (
        <LinkBubble key={link.id} index={index} link={link} open={open} />
      ))}
      <InteractionProxy args={[3.25, 2.45, 0.9]} position={[0, 1.08, 0]} />
    </group>
  );
}
