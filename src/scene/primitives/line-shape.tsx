import { Edges, Outlines, RoundedBox } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import type { PropsWithChildren } from 'react';
import type { Vector2 } from 'three';

import { GlowOutline, type GlowOutlineProps } from '@/scene/effects/glow-effects';
import { useRoomStore } from '@/stores/room-store';

type TransformProps = Pick<ThreeElements['mesh'], 'position' | 'rotation' | 'scale'>;

interface ShapeProps extends TransformProps {
  accent?: 'active' | 'warm' | undefined;
  glow?: GlowOutlineProps | undefined;
  hovered?: boolean | undefined;
}

function useColors(accent?: ShapeProps['accent'], hovered?: boolean) {
  const theme = useRoomStore((state) => state.theme);
  const fill = theme === 'light' ? '#ffffff' : '#0b0d0f';
  const line =
    accent === 'warm'
      ? theme === 'light'
        ? '#b45309'
        : '#fbbf24'
      : accent === 'active' || hovered
        ? theme === 'light'
          ? '#0e7490'
          : '#67e8f9'
        : theme === 'light'
          ? '#000000'
          : '#f3f4f6';
  return { fill, line };
}

function MaterialAndEdges({
  accent,
  glow,
  hovered,
  threshold = 15,
}: Pick<ShapeProps, 'accent' | 'glow' | 'hovered'> & { threshold?: number }) {
  const colors = useColors(accent, hovered);
  return (
    <>
      <meshBasicMaterial
        color={colors.fill}
        polygonOffset
        polygonOffsetFactor={2}
        polygonOffsetUnits={2}
        toneMapped={false}
      />
      <Edges color={colors.line} threshold={threshold} />
      {hovered ? <Edges color={colors.line} threshold={threshold} scale={1.008} /> : null}
      {glow === undefined ? null : <GlowOutline {...glow} threshold={threshold} />}
    </>
  );
}

function RoundedMaterialAndOutline({
  accent,
  glow,
  hovered,
}: Pick<ShapeProps, 'accent' | 'glow' | 'hovered'>) {
  const colors = useColors(accent, hovered);
  return (
    <>
      <meshBasicMaterial
        color={colors.fill}
        polygonOffset
        polygonOffsetFactor={2}
        polygonOffsetUnits={2}
        toneMapped={false}
      />
      <Outlines color={colors.line} thickness={hovered ? 0.18 : 0.12} toneMapped={false} />
      {glow === undefined ? null : <GlowOutline {...glow} />}
    </>
  );
}

export function LineBox({
  accent,
  args,
  glow,
  hovered,
  ...props
}: ShapeProps & { args: [number, number, number] }) {
  return (
    <mesh {...props}>
      <boxGeometry args={args} />
      <MaterialAndEdges accent={accent} glow={glow} hovered={hovered} />
    </mesh>
  );
}

export function LineRoundedBox({
  accent,
  args,
  glow,
  hovered,
  radius = 0.12,
  ...props
}: ShapeProps & { args: [number, number, number]; radius?: number }) {
  return (
    <RoundedBox args={args} radius={radius} smoothness={4} {...props}>
      <RoundedMaterialAndOutline accent={accent} glow={glow} hovered={hovered} />
    </RoundedBox>
  );
}

export function LineCylinder({
  accent,
  args,
  glow,
  hovered,
  ...props
}: ShapeProps & { args: [number, number, number, number?] }) {
  return (
    <mesh {...props}>
      <cylinderGeometry args={args} />
      <MaterialAndEdges accent={accent} glow={glow} hovered={hovered} />
    </mesh>
  );
}

export function LineLathe({
  accent,
  args,
  glow,
  hovered,
  ...props
}: ShapeProps & { args: [Vector2[], number?] }) {
  return (
    <mesh {...props}>
      <latheGeometry args={args} />
      <MaterialAndEdges accent={accent} glow={glow} hovered={hovered} />
    </mesh>
  );
}

export function LineSphere({
  accent,
  args,
  glow,
  hovered,
  ...props
}: ShapeProps & { args: [number, number?, number?] }) {
  return (
    <mesh {...props}>
      <sphereGeometry args={args} />
      <MaterialAndEdges accent={accent} glow={glow} hovered={hovered} />
    </mesh>
  );
}

export function LinePlane({
  accent,
  args,
  glow,
  hovered,
  ...props
}: ShapeProps & { args: [number, number] }) {
  return (
    <mesh {...props}>
      <planeGeometry args={args} />
      <MaterialAndEdges accent={accent} glow={glow} hovered={hovered} />
    </mesh>
  );
}

export function InteractionProxy({
  args,
  ...props
}: TransformProps & { args: [number, number, number] }) {
  return (
    <mesh {...props}>
      <boxGeometry args={args} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export function WarmLight({
  children,
  visible,
  ...props
}: PropsWithChildren<TransformProps & { visible: boolean }>) {
  if (!visible) return null;
  return (
    <group {...props}>
      {children}
      <mesh>
        <coneGeometry args={[1.2, 2.6, 28, 1, true]} />
        <meshBasicMaterial
          color="#fbbf24"
          opacity={0.09}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
