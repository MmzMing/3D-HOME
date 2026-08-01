import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Euler, MathUtils, Quaternion, Vector3, type Group } from 'three';

import { profileConfig } from '@/config';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  advanceTimelineGlyph,
  createBurstPlan,
  getDollWordLimits,
  oldestOverflowIds,
  segmentGraphemes,
  type GlyphPlan,
  type TimelineGlyph,
} from '@/scene/doll-words/core';
import { useRoomStore } from '@/stores/room-store';
import type { CameraZone } from '@/types/room';

type VectorTuple = [number, number, number];
type QuaternionTuple = [number, number, number, number];

interface SceneGlyph extends TimelineGlyph {
  angularVelocity: VectorTuple;
  burstId: number;
  character: string;
  createdAt: number;
  expiresAt: number | null;
  fontSize: number;
  fontSource: string;
  hadPhysics: boolean;
  height: number;
  impulse: VectorTuple;
  mode: 'motion' | 'reduced';
  position: VectorTuple;
  quaternion: QuaternionTuple;
  width: number;
}

const clearDurationMs = 320;
const reducedVisibleMs = 820;
const fallingVisibleMs = 2_100;
const settledVisibleMs = 700;
const sdfGlyphSize = 64;
const preloadCharacters = Array.from(
  new Set(profileConfig.intro.audioPhrases.flatMap(({ phrase }) => segmentGraphemes(phrase))),
).join('');

const spawnBounds: Record<
  CameraZone,
  { x: [number, number]; y: [number, number]; z: [number, number] }
> = {
  lounge: { x: [-8.1, 7.2], y: [2.15, 3.8], z: [-1.4, 6.4] },
  overview: { x: [-7.8, 7.3], y: [2.2, 4.05], z: [-6.3, 6.1] },
  workspace: { x: [-8.1, 5.4], y: [2.3, 4.1], z: [-7.2, -1.15] },
};

function randomSpawnPosition(zone: CameraZone, random: [number, number, number]): VectorTuple {
  const bounds = spawnBounds[zone];
  return [
    MathUtils.lerp(bounds.x[0], bounds.x[1], random[0]),
    MathUtils.lerp(bounds.y[0], bounds.y[1], random[1]),
    MathUtils.lerp(bounds.z[0], bounds.z[1], random[2]),
  ];
}

function StaticRoomColliders() {
  return (
    <RigidBody type="fixed" colliders={false} name="doll-word-room-colliders">
      <CuboidCollider args={[10, 0.06, 8.5]} position={[0, -0.91, 0]} />
      <CuboidCollider args={[0.08, 4.6, 8.6]} position={[-10.04, 3.35, 0]} />
      <CuboidCollider args={[0.08, 4.6, 8.6]} position={[10.04, 3.35, 0]} />
      <CuboidCollider args={[10.1, 4.6, 0.08]} position={[0, 3.35, -8.54]} />
      <CuboidCollider args={[10.1, 4.6, 0.08]} position={[0, 3.35, 8.54]} />

      <CuboidCollider args={[3.9, 0.1, 1.125]} position={[-0.9, 1.23, -6.55]} />
      <CuboidCollider args={[2.825, 0.065, 2.225]} position={[6.76, 0.37, 5.05]} />
      <CuboidCollider args={[0.91, 0.12, 3.75]} position={[-8.48, 0.17, 0.22]} />
      <CuboidCollider args={[0.93, 0.11, 2.3]} position={[-5.52, 0.17, 0.22]} />

      {[-0.77, 0.46, 1.71, 2.96].map((y) => (
        <CuboidCollider key={y} args={[0.52, 0.08, 1.725]} position={[-9.34, y, -6.55]} />
      ))}
      <CuboidCollider args={[0.52, 2.025, 0.085]} position={[-9.34, 1.09, -8.19]} />
      <CuboidCollider args={[0.52, 2.025, 0.085]} position={[-9.34, 1.09, -4.91]} />
      <CuboidCollider args={[0.05, 1.85, 1.725]} position={[-9.83, 1.09, -6.55]} />
    </RigidBody>
  );
}

function WarmupReady({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return null;
}

function FontWarmup({ onReady }: { onReady: () => void }) {
  return (
    <>
      <group visible={false}>
        {profileConfig.intro.dollFonts.map((font) => (
          <Text
            key={font.src}
            characters={preloadCharacters}
            font={font.src}
            fontSize={0.1}
            sdfGlyphSize={sdfGlyphSize}
          >
            {preloadCharacters}
          </Text>
        ))}
      </group>
      <WarmupReady onReady={onReady} />
    </>
  );
}

function GlyphText({
  character,
  fontSize,
  fontSource,
}: Pick<SceneGlyph, 'character' | 'fontSize' | 'fontSource'>) {
  const theme = useRoomStore((state) => state.theme);
  const face = theme === 'light' ? '#fffefd' : '#090a0e';
  const outline = theme === 'light' ? '#111217' : '#fffaff';

  return (
    <Text
      anchorX="center"
      anchorY="middle"
      color={face}
      fillOpacity={1}
      font={fontSource}
      fontSize={fontSize}
      outlineColor={outline}
      outlineOpacity={1}
      outlineWidth={fontSize * 0.025}
      sdfGlyphSize={sdfGlyphSize}
    >
      {character}
    </Text>
  );
}

function GlyphVisual({ glyph }: { glyph: SceneGlyph }) {
  const animated = useRef<Group>(null);

  useFrame(() => {
    const group = animated.current;
    if (group === null) return;
    const now = performance.now();
    if (glyph.clearingStartedAt !== null) {
      const progress = MathUtils.clamp((now - glyph.clearingStartedAt) / clearDurationMs, 0, 1);
      const scale = MathUtils.lerp(1, 0.08, progress);
      group.scale.setScalar(scale);
    }
  });

  return (
    <group ref={animated}>
      <GlyphText
        character={glyph.character}
        fontSize={glyph.fontSize}
        fontSource={glyph.fontSource}
      />
    </group>
  );
}

function HeldGlyph({ glyph }: { glyph: SceneGlyph }) {
  return (
    <group position={glyph.position} quaternion={glyph.quaternion}>
      <GlyphVisual glyph={glyph} />
    </group>
  );
}

function PhysicsGlyph({
  glyph,
  onRemove,
  onSleep,
}: {
  glyph: SceneGlyph;
  onRemove: (id: string) => void;
  onSleep: (id: string) => void;
}) {
  const body = useRef<RapierRigidBody>(null);
  const frame = useRef(0);
  const dynamic = glyph.stage === 'dynamic';

  useEffect(() => {
    if (!dynamic) return;
    const rigidBody = body.current;
    if (rigidBody === null) return;
    rigidBody.applyImpulse({ x: glyph.impulse[0], y: glyph.impulse[1], z: glyph.impulse[2] }, true);
    rigidBody.setAngvel(
      {
        x: glyph.angularVelocity[0],
        y: glyph.angularVelocity[1],
        z: glyph.angularVelocity[2],
      },
      true,
    );
  }, [dynamic, glyph.angularVelocity, glyph.impulse]);

  useEffect(() => {
    if (glyph.clearingStartedAt === null) return;
    body.current?.setEnabled(false);
  }, [glyph.clearingStartedAt]);

  useFrame(() => {
    if (!dynamic) return;
    frame.current += 1;
    if (frame.current % 8 !== 0 || body.current === null) return;
    const position = body.current.translation();
    if (position.y < -2.2 || Math.abs(position.x) > 11.2 || Math.abs(position.z) > 9.7) {
      onRemove(glyph.id);
    }
  });

  return (
    <RigidBody
      ref={body}
      canSleep
      colliders={false}
      angularDamping={2.8}
      linearDamping={0.05}
      name={`doll-word-${glyph.id}`}
      onSleep={() => {
        if (dynamic) onSleep(glyph.id);
      }}
      position={glyph.position}
      quaternion={glyph.quaternion}
      softCcdPrediction={0.55}
      type={dynamic ? 'dynamic' : 'fixed'}
    >
      <CuboidCollider
        args={[Math.max(0.08, glyph.width * 0.43), Math.max(0.12, glyph.height * 0.44), 0.065]}
        friction={0.72}
        mass={0.24}
        restitution={0.16}
      />
      <GlyphVisual glyph={glyph} />
    </RigidBody>
  );
}

function glyphWorldTransform(
  plan: GlyphPlan,
  anchor: VectorTuple,
  cameraQuaternion: Quaternion,
  phraseQuaternion: Quaternion,
) {
  const right = new Vector3(1, 0, 0).applyQuaternion(cameraQuaternion);
  const up = new Vector3(0, 1, 0).applyQuaternion(cameraQuaternion);
  const forward = new Vector3(0, 0, -1).applyQuaternion(cameraQuaternion);
  const position = new Vector3(...anchor)
    .addScaledVector(right, plan.x)
    .addScaledVector(up, plan.y)
    .addScaledVector(forward, (plan.sourceIndex % 3) * 0.008);
  return {
    position: position.toArray(),
    quaternion: phraseQuaternion.toArray(),
  };
}

function DollWordBodies() {
  const burst = useRoomStore((state) => state.dollWordBurst);
  const cameraZone = useRoomStore((state) => state.cameraZone);
  const clearRevision = useRoomStore((state) => state.dollWordClearRevision);
  const setCount = useRoomStore((state) => state.setDollWordCount);
  const reducedMotion = useReducedMotion();
  const { camera, size } = useThree();
  const mobile = size.width < 720;
  const limits = getDollWordLimits(mobile);
  const [glyphs, setGlyphs] = useState<SceneGlyph[]>([]);
  const lastBurstId = useRef(0);
  const lastClearRevision = useRef(clearRevision);

  useEffect(() => {
    if (burst === null || burst.id === lastBurstId.current) return;
    lastBurstId.current = burst.id;
    const now = performance.now();
    const fonts = profileConfig.intro.dollFonts;
    const plan = createBurstPlan(burst.id, burst.phrase, {
      anchorCount: 1,
      fontCount: fonts.length,
      mobile,
      reducedMotion,
    });
    const anchor = randomSpawnPosition(cameraZone, plan.spawn);
    camera.updateMatrixWorld();
    const cameraQuaternion = camera.quaternion.clone();
    const phraseQuaternion = cameraQuaternion
      .clone()
      .multiply(new Quaternion().setFromEuler(new Euler(...plan.tilt)));
    const font = fonts[plan.fontIndex] ?? fonts[0];
    if (font === undefined) return;

    const additions = plan.glyphs
      .filter((glyph) => !glyph.isWhitespace)
      .map<SceneGlyph>((glyph, index) => {
        const transform = glyphWorldTransform(glyph, anchor, cameraQuaternion, phraseQuaternion);
        return {
          angularVelocity: glyph.angularVelocity,
          burstId: burst.id,
          character: glyph.grapheme,
          clearingStartedAt: null,
          createdAt: now + index * 0.001,
          expiresAt: reducedMotion ? now + reducedVisibleMs : null,
          fontSize: plan.fontSize,
          fontSource: font.src,
          hadPhysics: false,
          height: glyph.height,
          id: `${String(burst.id)}-${String(glyph.sourceIndex)}`,
          impulse: glyph.impulse,
          mode: plan.mode,
          position: transform.position,
          quaternion: transform.quaternion,
          releaseAt: glyph.releaseAfterMs === null ? null : now + Math.max(0, glyph.releaseAfterMs),
          showAt: now + glyph.showAfterMs,
          stage: reducedMotion ? 'held' : 'hidden',
          width: glyph.width,
        };
      });

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setGlyphs((current) => {
        const activeBurstIds = Array.from(
          new Set(
            current
              .filter((glyph) => glyph.stage === 'hidden' || glyph.stage === 'held')
              .map((glyph) => glyph.burstId),
          ),
        );
        const evictedBurstIds = new Set(
          activeBurstIds.slice(0, Math.max(0, activeBurstIds.length - limits.activePhrases + 1)),
        );
        const retained = current.flatMap((glyph) => {
          if (!evictedBurstIds.has(glyph.burstId)) return [glyph];
          if (glyph.stage === 'hidden') return [];
          if (glyph.stage === 'held') {
            return [
              { ...glyph, clearingStartedAt: now, releaseAt: null, stage: 'clearing' as const },
            ];
          }
          return [glyph];
        });
        return [...retained, ...additions];
      });
    });
    return () => {
      cancelled = true;
    };
  }, [burst, camera, cameraZone, limits.activePhrases, mobile, reducedMotion]);

  useEffect(() => {
    if (clearRevision === lastClearRevision.current) return;
    lastClearRevision.current = clearRevision;
    const now = performance.now();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setGlyphs((current) =>
        current.flatMap((glyph) =>
          glyph.stage === 'hidden'
            ? []
            : [
                {
                  ...glyph,
                  clearingStartedAt: now,
                  releaseAt: null,
                  stage: 'clearing' as const,
                },
              ],
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [clearRevision]);

  useEffect(() => {
    if (!reducedMotion) return;
    const now = performance.now();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setGlyphs((current) =>
        current.flatMap((glyph) => {
          if (glyph.mode === 'reduced') return [glyph];
          if (glyph.stage === 'hidden') return [];
          return [
            { ...glyph, clearingStartedAt: now, releaseAt: null, stage: 'clearing' as const },
          ];
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  const timelineActive = glyphs.some(
    (glyph) =>
      glyph.stage === 'hidden' ||
      glyph.stage === 'held' ||
      glyph.stage === 'clearing' ||
      glyph.clearingStartedAt !== null ||
      glyph.expiresAt !== null,
  );

  useEffect(() => {
    if (!timelineActive) return;
    let frame = 0;
    const tick = () => {
      const now = performance.now();
      setGlyphs((current) => {
        let changed = false;
        let next = current.flatMap((glyph) => {
          if (
            glyph.clearingStartedAt !== null &&
            now - glyph.clearingStartedAt >= clearDurationMs
          ) {
            changed = true;
            return [];
          }
          if (
            glyph.expiresAt !== null &&
            now >= glyph.expiresAt &&
            glyph.clearingStartedAt === null
          ) {
            changed = true;
            return [{ ...glyph, clearingStartedAt: now, stage: 'clearing' as const }];
          }
          const advanced = advanceTimelineGlyph(glyph, now) as SceneGlyph;
          if (advanced !== glyph) {
            changed = true;
            const justReleased = glyph.stage !== 'dynamic' && advanced.stage === 'dynamic';
            return [
              {
                ...advanced,
                expiresAt: justReleased ? now + fallingVisibleMs : advanced.expiresAt,
                hadPhysics: advanced.stage === 'dynamic' || glyph.hadPhysics,
              },
            ];
          }
          return [glyph];
        });

        const overflowIds = new Set(oldestOverflowIds(next, limits.glyphs));
        if (overflowIds.size > 0) {
          changed = true;
          next = next.map((glyph) =>
            overflowIds.has(glyph.id)
              ? { ...glyph, clearingStartedAt: now, releaseAt: null, stage: 'clearing' as const }
              : glyph,
          );
        }
        return changed ? next : current;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [limits.glyphs, timelineActive]);

  const visibleCount = useMemo(
    () =>
      glyphs.filter(
        (glyph) =>
          glyph.clearingStartedAt === null && (glyph.stage === 'held' || glyph.stage === 'dynamic'),
      ).length,
    [glyphs],
  );

  useEffect(() => setCount(visibleCount), [setCount, visibleCount]);
  useEffect(() => () => setCount(0), [setCount]);

  const removeGlyph = useCallback((id: string) => {
    setGlyphs((current) => current.filter((glyph) => glyph.id !== id));
  }, []);

  const settleGlyph = useCallback((id: string) => {
    const expiresAt = performance.now() + settledVisibleMs;
    setGlyphs((current) =>
      current.map((glyph) =>
        glyph.id === id && (glyph.expiresAt === null || expiresAt < glyph.expiresAt)
          ? { ...glyph, expiresAt }
          : glyph,
      ),
    );
  }, []);

  return glyphs.map((glyph) => {
    if (glyph.stage === 'hidden') return null;
    if (glyph.mode === 'motion') {
      return (
        <PhysicsGlyph key={glyph.id} glyph={glyph} onRemove={removeGlyph} onSleep={settleGlyph} />
      );
    }
    return <HeldGlyph key={glyph.id} glyph={glyph} />;
  });
}

export default function DollWordPhysics({ onReady }: { onReady: () => void }) {
  return (
    <Physics colliders={false} gravity={[0, -200, 0]} timeStep={1 / 60} updateLoop="independent">
      <FontWarmup onReady={onReady} />
      <StaticRoomColliders />
      <DollWordBodies />
    </Physics>
  );
}
