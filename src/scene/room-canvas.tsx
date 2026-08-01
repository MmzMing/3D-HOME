import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';

import { RoomScene } from '@/scene/room-scene';
import { useRoomStore } from '@/stores/room-store';

interface RoomCanvasProps {
  onCanvasReady: () => void;
  onDollWordsReady: () => void;
  onSceneReady: () => void;
}

function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return null;
}

export function RoomCanvas({ onCanvasReady, onDollWordsReady, onSceneReady }: RoomCanvasProps) {
  const theme = useRoomStore((state) => state.theme);
  return (
    <div className="room-canvas" aria-hidden="true" data-testid="room-canvas">
      <Canvas
        orthographic
        dpr={[1, theme === 'dark' ? 1.5 : 1.75]}
        frameloop="demand"
        camera={{ far: 140, near: 0.1, position: [20, 14.5, 22], zoom: 58 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(theme === 'light' ? '#ffffff' : '#0b0d0f');
          onCanvasReady();
        }}
      >
        <color attach="background" args={[theme === 'light' ? '#ffffff' : '#0b0d0f']} />
        <Suspense fallback={null}>
          <RoomScene onDollWordsReady={onDollWordsReady} />
          <SceneReady onReady={onSceneReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function RoomFallback() {
  return (
    <div className="room-fallback" role="img" aria-label="矢量线稿房间静态预览">
      <img src="/assets/fallback/room.svg" alt="矢量线稿房间静态预览" />
    </div>
  );
}
