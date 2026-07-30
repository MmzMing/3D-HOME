import { Text, useCursor } from '@react-three/drei';
import { useState } from 'react';

import { siteRecordsConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';

const pixelFont = '/assets/fonts/ark-pixel-12px-proportional-zh-cn.woff';

interface RecordLinkProps {
  label: string;
  position: [number, number, number];
  url: string;
}

function RecordLink({ label, position, url }: RecordLinkProps) {
  const [hovered, setHovered] = useState(false);
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));
  useCursor(hovered);

  return (
    <Text
      anchorX="left"
      anchorY="middle"
      color={hovered ? '#0e7490' : color}
      font={pixelFont}
      fontSize={0.24}
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
      {label}
    </Text>
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
        label={siteRecordsConfig.police.label}
        position={[0, -0.24, 0]}
        url={siteRecordsConfig.police.url}
      />
    </group>
  );
}
