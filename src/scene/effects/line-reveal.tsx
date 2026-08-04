import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import {
  InstancedBufferAttribute,
  MathUtils,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

const revealDurationSeconds = 6;

export const roomRevealRuntime = {
  progress: { current: 0 },
};

export function getRoomRevealFade() {
  return MathUtils.smoothstep(roomRevealRuntime.progress.current, 0.76, 1);
}

interface RevealUniform {
  value: number;
}

interface RevealGeometry extends BufferGeometry {
  userData: BufferGeometry['userData'] & { roomRevealPrepared?: boolean };
}

interface RevealObject extends Object3D {
  geometry?: RevealGeometry;
  isLine2?: boolean;
  isLineSegments2?: boolean;
  material?: Material | Material[];
}

interface RevealMaterial extends Material {
  isLineMaterial?: boolean;
}

const startAttribute = 'aRoomRevealStart';
const durationAttribute = 'aRoomRevealDuration';
const modeAttribute = 'aRoomRevealMode';

function hashNoise(...values: number[]) {
  let seed = 17.23;
  for (const value of values) seed += value * 31.71;
  const value = Math.sin(seed) * 43758.5453123;
  return value - Math.floor(value);
}

function isFloorPatternObject(object: Object3D) {
  let current: Object3D | null = object;
  while (current !== null) {
    if ((current.userData as { roomFloorPattern?: boolean }).roomFloorPattern === true) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function getSpatialOrder(point: Vector3, floorPattern = false) {
  if (floorPattern) {
    const floorDepth = MathUtils.clamp((point.z + 9) / 18, 0, 1);
    return MathUtils.clamp(0.04 + floorDepth * 0.9, 0, 1);
  }

  const height = MathUtils.clamp((point.y + 1) / 8.6, 0, 1);
  const diagonalSweep = MathUtils.clamp((point.x + point.z + 20) / 40, 0, 1);
  const depth = MathUtils.clamp((point.z + 9) / 18, 0, 1);
  return MathUtils.clamp(height * 0.76 + diagonalSweep * 0.12 + depth * 0.06, 0, 1);
}

function getRevealMetadata(
  start: Vector3,
  end: Vector3,
  index: number,
  objectOffset: number,
  floorPattern: boolean,
) {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const spatial = getSpatialOrder(midpoint, floorPattern);
  const noise = hashNoise(midpoint.x, midpoint.y, midpoint.z, index);
  const directionNoise = hashNoise(midpoint.z, midpoint.x, index * 1.37);
  const order = floorPattern
    ? MathUtils.clamp(0.015 + spatial * 0.42, 0, 0.42)
    : 0.015 + MathUtils.clamp(spatial + objectOffset * 0.12 + noise * 0.06, 0, 1) * 0.8;
  const length = start.distanceTo(end);
  const duration = floorPattern
    ? 0.05 + MathUtils.clamp(length / 1000, 0.01, 0.04)
    : 0.065 + MathUtils.clamp(length / 18, 0.015, 0.095) + noise * 0.035;
  const mode = floorPattern ? 0 : directionNoise < 0.22 ? 1 : directionNoise < 0.56 ? 2 : 0;

  return { duration, mode, order };
}

function getMaterials(object: RevealObject) {
  if (object.material === undefined) return [];
  return Array.isArray(object.material) ? object.material : [object.material];
}

function isLineMaterial(material: Material) {
  const lineMaterial = material as RevealMaterial;
  return lineMaterial.type === 'LineMaterial' || lineMaterial.isLineMaterial === true;
}

function registerRevealFill(material: Material, point: Vector3) {
  if (material.type !== 'MeshBasicMaterial' || material.transparent) return;

  const userData = material.userData as {
    roomRevealFill?: boolean;
    roomRevealOriginalVisible?: boolean;
    roomRevealStart?: number;
  };
  userData.roomRevealFill = true;
  userData.roomRevealOriginalVisible ??= material.visible;
  userData.roomRevealStart ??= 0.015 + getSpatialOrder(point) * 0.8;
}

function updateRevealFills(scene: Object3D, progress: number) {
  scene.traverse((candidate) => {
    const object = candidate as RevealObject;
    for (const material of getMaterials(object)) {
      const userData = material.userData as {
        roomRevealFill?: boolean;
        roomRevealOriginalVisible?: boolean;
        roomRevealStart?: number;
      };
      if (!userData.roomRevealFill || userData.roomRevealStart === undefined) continue;
      material.visible =
        progress >= userData.roomRevealStart && userData.roomRevealOriginalVisible !== false;
    }
  });
}

function patchLineMaterial(material: Material, revealUniform: RevealUniform) {
  const lineMaterial = material as RevealMaterial;
  if (!isLineMaterial(material)) return;

  const userData = lineMaterial.userData as { roomRevealPatched?: boolean };
  if (userData.roomRevealPatched) {
    lineMaterial.needsUpdate = true;
    return;
  }

  const originalOnBeforeCompile = lineMaterial.onBeforeCompile.bind(lineMaterial);
  const originalCacheKey = lineMaterial.customProgramCacheKey();
  lineMaterial.onBeforeCompile = (shader, renderer) => {
    originalOnBeforeCompile(shader, renderer);
    shader.uniforms.uRoomReveal = revealUniform;
    shader.vertexShader = `
      attribute float ${startAttribute};
      attribute float ${durationAttribute};
      attribute float ${modeAttribute};
      varying float vRoomRevealStart;
      varying float vRoomRevealDuration;
      varying float vRoomRevealMode;
      ${shader.vertexShader}
    `.replace(
      'void main() {',
      `void main() {
        vRoomRevealStart = ${startAttribute};
        vRoomRevealDuration = ${durationAttribute};
        vRoomRevealMode = ${modeAttribute};`,
    );
    shader.fragmentShader = `
      uniform float uRoomReveal;
      varying float vRoomRevealStart;
      varying float vRoomRevealDuration;
      varying float vRoomRevealMode;
      ${shader.fragmentShader}
    `.replace(
      'void main() {',
      `void main() {
        float roomRevealProgress = clamp(
          (uRoomReveal - vRoomRevealStart) / max(vRoomRevealDuration, 0.0001),
          0.0,
          1.0
        );
        if (roomRevealProgress <= 0.001) discard;
        float roomRevealAlong = clamp(vUv.y * 0.5 + 0.5, 0.0, 1.0);
        if (vRoomRevealMode > 1.5) {
          if (1.0 - roomRevealAlong > roomRevealProgress) discard;
        } else if (vRoomRevealMode > 0.5) {
          if (abs(vUv.y) > roomRevealProgress) discard;
        } else if (roomRevealAlong > roomRevealProgress) {
          discard;
        }`,
    );
  };
  lineMaterial.customProgramCacheKey = () => `${originalCacheKey}:room-reveal-v1`;
  userData.roomRevealPatched = true;
  lineMaterial.needsUpdate = true;
}

function prepareRevealScene(scene: Object3D, revealUniform: RevealUniform) {
  scene.updateMatrixWorld(true);
  scene.traverse((candidate) => {
    const object = candidate as RevealObject;
    const materials = getMaterials(object);
    const floorPattern = isFloorPatternObject(object);
    const geometry = object.geometry;
    const start = geometry?.getAttribute('instanceStart');
    const end = geometry?.getAttribute('instanceEnd');
    const isLineObject =
      object.isLineSegments2 === true ||
      object.isLine2 === true ||
      (start !== undefined && end !== undefined && materials.some(isLineMaterial));

    if (isLineObject) {
      if (geometry === undefined || start === undefined || end === undefined) return;

      const count = Math.min(start.count, end.count);
      const starts = new Float32Array(count);
      const durations = new Float32Array(count);
      const modes = new Float32Array(count);
      const worldStart = new Vector3();
      const worldEnd = new Vector3();
      const objectOffset = hashNoise(
        object.matrixWorld.elements[12],
        object.matrixWorld.elements[13],
        object.matrixWorld.elements[14],
        object.id,
      );

      for (let index = 0; index < count; index += 1) {
        worldStart.fromBufferAttribute(start, index).applyMatrix4(object.matrixWorld);
        worldEnd.fromBufferAttribute(end, index).applyMatrix4(object.matrixWorld);
        const metadata = getRevealMetadata(worldStart, worldEnd, index, objectOffset, floorPattern);
        starts[index] = metadata.order;
        durations[index] = metadata.duration;
        modes[index] = metadata.mode;
      }

      geometry.setAttribute(startAttribute, new InstancedBufferAttribute(starts, 1));
      geometry.setAttribute(durationAttribute, new InstancedBufferAttribute(durations, 1));
      geometry.setAttribute(modeAttribute, new InstancedBufferAttribute(modes, 1));
      geometry.userData.roomRevealPrepared = true;
      for (const material of materials) patchLineMaterial(material, revealUniform);
      return;
    }

    if (materials.length === 0) return;
    const point = new Vector3().setFromMatrixPosition(object.matrixWorld);
    for (const material of materials) {
      registerRevealFill(material, point);
    }
  });
}

interface RoomLineRevealProps {
  active: boolean;
  onComplete: () => void;
}

export function RoomLineReveal({ active, onComplete }: RoomLineRevealProps) {
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = useReducedMotion();
  const revealUniform = useRef<RevealUniform>({ value: 0 });
  const started = useRef(false);
  const completed = useRef(false);
  const startTime = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      prepareRevealScene(scene, revealUniform.current),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [scene]);

  useEffect(() => () => updateRevealFills(scene, 1), [scene]);

  useEffect(() => {
    if (!active || started.current) return;

    prepareRevealScene(scene, revealUniform.current);
    updateRevealFills(scene, 0);
    roomRevealRuntime.progress.current = 0;
    started.current = true;
    completed.current = false;
    startTime.current = null;
    revealUniform.current.value = reducedMotion ? 1 : 0;

    if (reducedMotion) {
      roomRevealRuntime.progress.current = 1;
      updateRevealFills(scene, 1);
      completed.current = true;
      onCompleteRef.current();
      return;
    }

    invalidate();
  }, [active, invalidate, reducedMotion, scene]);

  useFrame((state) => {
    if (!active || completed.current) return;

    if (reducedMotion) {
      roomRevealRuntime.progress.current = 1;
      revealUniform.current.value = 1;
      updateRevealFills(scene, 1);
      completed.current = true;
      onCompleteRef.current();
      return;
    }

    startTime.current ??= state.clock.elapsedTime;
    const linearProgress = MathUtils.clamp(
      (state.clock.elapsedTime - startTime.current) / revealDurationSeconds,
      0,
      1,
    );
    revealUniform.current.value = 1 - (1 - linearProgress) ** 1.7;
    roomRevealRuntime.progress.current = revealUniform.current.value;
    updateRevealFills(scene, revealUniform.current.value);

    if (linearProgress >= 1) {
      roomRevealRuntime.progress.current = 1;
      updateRevealFills(scene, 1);
      completed.current = true;
      onCompleteRef.current();
      return;
    }

    invalidate();
  });

  return null;
}
