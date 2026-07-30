import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect } from 'react';
import type { OrthographicCamera } from 'three';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useRoomStore } from '@/stores/room-store';

const zones = {
  lounge: { position: [20, 14.5, 23] as const, target: [0.8, 1.8, 1.8] as const, zoom: 64 },
  overview: { position: [20, 14.5, 22] as const, target: [0, 2.85, 0.18] as const, zoom: 53 },
  workspace: { position: [18.5, 13.2, 21] as const, target: [-0.8, 2.7, -5.8] as const, zoom: 70 },
};

export function CameraRig() {
  const zone = useRoomStore((state) => state.cameraZone);
  const reducedMotion = useReducedMotion();
  const { get, invalidate, size } = useThree();

  useEffect(() => {
    const orthographic = get().camera as OrthographicCamera;
    const destination = zones[zone];
    const mobile = size.width < 720;
    const zoom = destination.zoom * (mobile ? 0.7 : 1);
    const target = { x: destination.target[0], y: destination.target[1], z: destination.target[2] };

    const applyLookAt = () => {
      orthographic.lookAt(target.x, target.y, target.z);
      orthographic.zoom = zoom;
      orthographic.updateProjectionMatrix();
      invalidate();
    };

    if (reducedMotion) {
      orthographic.position.set(
        destination.position[0],
        destination.position[1],
        destination.position[2],
      );
      applyLookAt();
      return;
    }

    const context = gsap.context(() => {
      gsap.to(orthographic.position, {
        duration: 0.62,
        ease: 'power2.out',
        x: destination.position[0],
        y: destination.position[1],
        z: destination.position[2],
        onUpdate: applyLookAt,
      });
      gsap.to(orthographic, {
        duration: 0.62,
        ease: 'power2.out',
        zoom,
        onUpdate: () => {
          orthographic.updateProjectionMatrix();
          invalidate();
        },
      });
    });
    return () => context.revert();
  }, [get, invalidate, reducedMotion, size.width, zone]);

  return null;
}
