import { MapControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { Vector3, type OrthographicCamera } from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useRoomStore } from '@/stores/room-store';

export const cameraZones = {
  lounge: { position: [20, 14.5, 23] as const, target: [0.8, 1.8, 1.8] as const, zoom: 70 },
  overview: { position: [20, 14.5, 22] as const, target: [0, 2.85, 0.18] as const, zoom: 58 },
  workspace: { position: [18.5, 13.2, 21] as const, target: [-0.8, 2.7, -5.8] as const, zoom: 77 },
};

export const cameraFocuses = {
  bookshelf: {
    position: [8.8, 9.2, 7.6] as const,
    target: [-10.45, 1.18, -5.55] as const,
    zoom: 91,
  },
  door: {
    position: [15.6, 9.4, 4.6] as const,
    target: [7.85, 1.65, -8.15] as const,
    zoom: 103,
  },
  keyboard: {
    position: [10.5, 9.4, 0.9] as const,
    target: [-2.18, 0.98, -5.98] as const,
    zoom: 166,
  },
  laptop: {
    position: [13.4, 8.7, 2.8] as const,
    target: [-1.82, 1.15, -6.42] as const,
    zoom: 126,
  },
  portrait: {
    position: [18, 9.5, 18.5] as const,
    target: [-8.45, 2.6, 5] as const,
    zoom: 120,
  },
  weather: {
    position: [13.4, 11.8, 2.8] as const,
    target: [6.5, 5.35, -9.5] as const,
    zoom: 112,
  },
} as const;

export function CameraRig() {
  const cameraFocus = useRoomStore((state) => state.cameraFocus);
  const zone = useRoomStore((state) => state.cameraZone);
  const reducedMotion = useReducedMotion();
  const { get, invalidate, size } = useThree();
  const cameraTarget = useRef<Vector3 | null>(null);

  useLayoutEffect(() => {
    const orthographic = get().camera as OrthographicCamera;
    const desktop = size.width >= 720;
    const destination =
      cameraFocus === null || !desktop ? cameraZones[zone] : cameraFocuses[cameraFocus];
    const mobile = !desktop;
    const zoom = destination.zoom * (mobile ? 0.7 : 1);
    cameraTarget.current ??= new Vector3(...cameraZones[zone].target);
    const currentTarget = cameraTarget.current;
    const target = new Vector3(...destination.target);

    // Keep interrupted transitions continuous by starting from the camera's current values.
    const updateCamera = () => {
      orthographic.lookAt(currentTarget.x, currentTarget.y, currentTarget.z);
      orthographic.updateProjectionMatrix();
      invalidate();
    };

    updateCamera();

    if (reducedMotion) {
      orthographic.position.set(
        destination.position[0],
        destination.position[1],
        destination.position[2],
      );
      currentTarget.copy(target);
      orthographic.zoom = zoom;
      updateCamera();
      return;
    }

    const startPosition = orthographic.position.clone();
    const endPosition = new Vector3(...destination.position);
    const startTarget = currentTarget.clone();
    const routeControl = startPosition.clone().lerp(endPosition, 0.5);
    routeControl.y += Math.min(4.4, Math.max(1.4, startPosition.distanceTo(endPosition) * 0.11));
    const targetControl = startTarget.clone().lerp(target, 0.5);
    const travel = { progress: 0 };
    const startZoom = orthographic.zoom;

    const animation = gsap.to(travel, {
      duration: 1.18,
      ease: 'power3.inOut',
      progress: 1,
      onUpdate: () => {
        const progress = travel.progress;
        const inverse = 1 - progress;
        const first = inverse * inverse;
        const middle = 2 * inverse * progress;
        const last = progress * progress;
        orthographic.position.set(
          first * startPosition.x + middle * routeControl.x + last * endPosition.x,
          first * startPosition.y + middle * routeControl.y + last * endPosition.y,
          first * startPosition.z + middle * routeControl.z + last * endPosition.z,
        );
        currentTarget.set(
          first * startTarget.x + middle * targetControl.x + last * target.x,
          first * startTarget.y + middle * targetControl.y + last * target.y,
          first * startTarget.z + middle * targetControl.z + last * target.z,
        );
        orthographic.zoom = startZoom + (zoom - startZoom) * progress;
        updateCamera();
      },
    });

    return () => {
      animation.kill();
    };
  }, [cameraFocus, get, invalidate, reducedMotion, size.width, zone]);

  if (size.width >= 720) return null;

  return (
    <MapControls
      enableDamping
      enablePan
      enableRotate={false}
      enableZoom={false}
      panSpeed={0.7}
      target={
        (cameraFocus === null || size.width < 720 ? cameraZones[zone] : cameraFocuses[cameraFocus])
          .target
      }
    />
  );
}
