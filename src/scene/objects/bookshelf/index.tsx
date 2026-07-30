import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { MathUtils, type Group } from 'three';

import { feedsConfig, type FeedConfig } from '@/config';
import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomStore } from '@/stores/room-store';
import { playRoomSound } from '@/utils/room-audio';

const booksPerShelf = 7;

function FeedBook({
  feed,
  index,
  onHoverName,
}: {
  feed: FeedConfig;
  index: number;
  onHoverName: (name: string | null) => void;
}) {
  const book = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const openFeed = useRoomStore((state) => state.openFeed);
  const setHoveredObject = useRoomStore((state) => state.setHoveredObject);
  const sound = useRoomStore((state) => state.isSoundEnabled);
  const invalidate = useThree((state) => state.invalidate);
  const shelf = Math.floor(index / booksPerShelf);
  const localIndex = index % booksPerShelf;
  const x = -1.34 + localIndex * 0.44;
  const y = 0.22 + shelf * 1.25;
  const height = 0.78 + (index % 4) * 0.08;

  useFrame((_, delta) => {
    if (book.current === null) return;
    const targetZ = hovered ? 0.54 : 0;
    const targetY = hovered ? 0.06 : 0;
    book.current.position.z = MathUtils.damp(book.current.position.z, targetZ, 10, delta);
    book.current.position.y = MathUtils.damp(book.current.position.y, targetY, 10, delta);
    book.current.rotation.x = MathUtils.damp(
      book.current.rotation.x,
      hovered ? -0.035 : 0,
      10,
      delta,
    );
    if (
      Math.abs(book.current.position.z - targetZ) > 0.001 ||
      Math.abs(book.current.position.y - targetY) > 0.001
    ) {
      invalidate();
    }
  });

  return (
    <group
      position={[x, y, 0.22]}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        setHoveredObject('bookshelf');
        onHoverName(feed.name);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(false);
        setHoveredObject(null);
        onHoverName(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
        openFeed(feed.id);
        playRoomSound('soft', sound);
      }}
    >
      <group ref={book}>
        <LineBox
          args={[0.32, height, 0.62]}
          position={[0, height / 2, 0]}
          hovered={hovered}
          accent={hovered ? 'active' : undefined}
        />
        <LineBox args={[0.22, 0.035, 0.04]} position={[0, height * 0.62, 0.335]} />
      </group>
    </group>
  );
}

export function Bookshelf() {
  const feeds = feedsConfig.filter((feed) => feed.enabled).slice(0, 21);
  const [hoveredFeedName, setHoveredFeedName] = useState<string | null>(null);
  const theme = useRoomStore((state) => state.theme);
  return (
    <group position={[-9.34, 0, -6.55]} rotation={[0, Math.PI / 2, 0]}>
      {[0.08, 1.31, 2.56, 3.81].map((y) => (
        <LineBox key={y} args={[3.45, 0.16, 1.04]} position={[0, y, 0]} />
      ))}
      <LineBox args={[0.17, 4.05, 1.04]} position={[-1.64, 1.94, 0]} />
      <LineBox args={[0.17, 4.05, 1.04]} position={[1.64, 1.94, 0]} />
      <LineBox args={[0.12, 3.7, 0.1]} position={[0, 1.94, -0.49]} />
      {hoveredFeedName === null ? null : (
        <group position={[0, 4.42, 0.68]}>
          <LineBox args={[3.05, 0.62, 0.08]} accent="active" />
          <Text
            position={[0, 0, 0.05]}
            fontSize={0.23}
            color={theme === 'light' ? '#0e7490' : '#67e8f9'}
            anchorX="center"
            anchorY="middle"
            maxWidth={2.7}
          >
            {hoveredFeedName}
          </Text>
        </group>
      )}
      {feeds.map((feed, index) => (
        <FeedBook key={feed.id} feed={feed} index={index} onHoverName={setHoveredFeedName} />
      ))}
    </group>
  );
}
