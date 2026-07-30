import { Line, Text, useCursor } from '@react-three/drei';
import { useState } from 'react';

import { siteRecordsConfig } from '@/config';
import { InteractionProxy, LineBox, LineCylinder, WarmLight } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function DeskLamp() {
  const interaction = useRoomInteraction('desk-lamp');
  const on = useRoomStore((state) => state.objectState.deskLampOn);
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  const [icpHovered, setIcpHovered] = useState(false);
  useCursor(icpHovered);

  return (
    <group position={[-2.25, 4.32, -7.06]} {...interaction.bind}>
      <LineCylinder
        args={[0.12, 0.12, 0.2, 14]}
        position={[0, 0.1, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />
      <LineBox
        args={[2.58, 0.18, 0.24]}
        position={[0, -0.02, 0.12]}
        rotation={[0.16, 0, 0]}
        hovered={interaction.hovered}
        accent={on ? 'warm' : undefined}
      />
      <LineBox
        args={[2.26, 0.04, 0.1]}
        position={[0, -0.13, 0.22]}
        accent={on ? 'warm' : undefined}
      />
      <Line
        points={[
          [-0.34, 0.06, -0.08],
          [-0.18, -0.34, -0.1],
          [0.18, -0.34, -0.1],
          [0.34, 0.06, -0.08],
        ]}
        color={color}
        lineWidth={1.1}
      />
      <LineCylinder args={[0.07, 0.07, 0.34, 10]} position={[0, -0.48, -0.1]} />
      <LineBox args={[0.58, 0.08, 0.25]} position={[0, -0.68, -0.04]} />
      <group position={[0, 0.86, 0.18]}>
        <LineBox args={[0.68, 0.3, 0.06]} accent={icpHovered ? 'active' : undefined} />
        <Text
          anchorX="center"
          anchorY="middle"
          color={icpHovered ? '#0e7490' : color}
          font="/assets/fonts/ark-pixel-12px-proportional-zh-cn.woff"
          fontSize={0.17}
          position={[0, 0, 0.04]}
          onClick={(event) => {
            event.stopPropagation();
            window.open(siteRecordsConfig.icp.url, '_blank', 'noopener,noreferrer');
          }}
          onPointerOut={(event) => {
            event.stopPropagation();
            setIcpHovered(false);
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            setIcpHovered(true);
          }}
        >
          ICP
        </Text>
      </group>
      <WarmLight visible={on} position={[0, -1.38, 0.5]} scale={[1.8, 0.9, 1.25]} />
      <InteractionProxy args={[3, 1.35, 0.9]} position={[0, -0.2, 0]} />
    </group>
  );
}
