import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, type Group } from 'three';

import { InteractionProxy, LineBox, LinePlane } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const sashWidth = 4.22;
const sashHeight = 3.48;

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
    <group position={[-9.88, 4.82, 0.15]} rotation={[0, Math.PI / 2, 0]} scale={[0.86, 1, 1]}>
      <group {...interaction.bind}>
        <LineBox args={[8.8, 0.18, 0.18]} position={[0, 1.92, 0.6]} hovered={interaction.hovered} />
        <LineBox
          args={[8.8, 0.18, 0.18]}
          position={[0, -1.92, 0.6]}
          hovered={interaction.hovered}
        />
        <LineBox
          args={[0.18, 4.58, 0.18]}
          position={[-4.49, 0.14, 0.6]}
          hovered={interaction.hovered}
        />
        <LineBox
          args={[0.18, 4.58, 0.18]}
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
            position={[2.14, 0, 0]}
            hovered={interaction.hovered}
          />
          <LineBox args={[sashWidth, 0.1, 0.14]} position={[2.14, 1.72, 0.04]} />
          <LineBox args={[sashWidth, 0.1, 0.14]} position={[2.14, -1.72, 0.04]} />
          <LineBox args={[0.1, sashHeight, 0.14]} position={[0.05, 0, 0.04]} />
          <LineBox args={[0.1, sashHeight, 0.14]} position={[4.23, 0, 0.04]} />
          <LineBox args={[0.08, 3.18, 0.08]} position={[2.14, 0, 0.08]} />
          <LineBox args={[4.02, 0.08, 0.08]} position={[2.14, 0, 0.08]} />
        </group>

        <group ref={rightSash} position={[4.36, 0, 0.58]}>
          <LinePlane
            args={[sashWidth, 3.32]}
            position={[-2.14, 0, 0]}
            hovered={interaction.hovered}
          />
          <LineBox args={[sashWidth, 0.1, 0.14]} position={[-2.14, 1.72, 0.04]} />
          <LineBox args={[sashWidth, 0.1, 0.14]} position={[-2.14, -1.72, 0.04]} />
          <LineBox args={[0.1, sashHeight, 0.14]} position={[-0.05, 0, 0.04]} />
          <LineBox args={[0.1, sashHeight, 0.14]} position={[-4.23, 0, 0.04]} />
          <LineBox args={[0.08, 3.18, 0.08]} position={[-2.14, 0, 0.08]} />
          <LineBox args={[4.02, 0.08, 0.08]} position={[-2.14, 0, 0.08]} />
        </group>

        <InteractionProxy args={[9.35, 4.35, 0.72]} />
      </group>

      <group {...curtainInteraction.bind}>
        <LineBox args={[8.8, 0.3, 0.18]} position={[0, 2.28, 0.6]} />
        <group ref={leftCurtain} position={[-4.12, 0.08, 0.6]} scale={[0.38, 1, 1]}>
          <LineBox
            args={[2.16, 3.86, 0.1]}
            hovered={curtainInteraction.hovered}
            accent={curtainsOpen ? undefined : 'active'}
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
            hovered={curtainInteraction.hovered}
            accent={curtainsOpen ? undefined : 'active'}
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
  );
}
