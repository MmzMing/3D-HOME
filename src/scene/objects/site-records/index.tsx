import { Image, Text, useCursor } from '@react-three/drei';
import { useState } from 'react';

import { sceneFont, siteRecordsConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';

interface RecordLinkProps {
  icon?: string;
  label: string;
  position: [number, number, number];
  url: string;
}

function RecordLink({ icon, label, position, url }: RecordLinkProps) {
  const [hovered, setHovered] = useState(false);
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  useCursor(hovered);

  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(false);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
    >
      {icon === undefined ? null : (
        <Image
          url={icon}
          position={[0.11, 0, 0.006]}
          scale={[0.22, 0.22]}
          toneMapped={false}
          transparent
        />
      )}
      <Text
        anchorX="left"
        anchorY="middle"
        color={hovered ? '#0e7490' : color}
        font={sceneFont}
        fontSize={0.24}
        position={[icon === undefined ? 0 : 0.27, 0, 0]}
      >
        {label}
      </Text>
    </group>
  );
}

export function SiteRecords() {
  return (
    <group position={[-7.65, 4.48, -8.2]}>
      <RecordLink
        label={siteRecordsConfig.icp.label}
        position={[0, 0.24, 0]}
        url={siteRecordsConfig.icp.url}
      />
      <RecordLink
        icon={siteRecordsConfig.police.icon}
        label={siteRecordsConfig.police.label}
        position={[0, -0.24, 0]}
        url={siteRecordsConfig.police.url}
      />
    </group>
  );
}
