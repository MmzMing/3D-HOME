import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { RoomLoader } from '@/components/common/room-loader';
import { FeedDialog } from '@/features/feeds';
import { DoorExitDialog } from '@/features/door-exit';
import { DollWords } from '@/features/doll-words';
import { LinkDialog } from '@/features/links';
import { MusicBootstrap, MusicDialog, NowPlaying } from '@/features/music';
import { ProfileDialog } from '@/features/profile';
import { SearchDialog } from '@/features/search';
import { WeatherPopover } from '@/features/weather';
import { RoomCanvas, RoomFallback } from '@/scene';
import { supportsWebGL } from '@/utils/webgl';

import { AppErrorBoundary } from './app-error-boundary';
import { ThemeSync } from './theme-sync';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60_000,
      },
    },
  });
}

function RoomExperience() {
  const [hasWebGL] = useState(supportsWebGL);
  const [canvasReady, setCanvasReady] = useState(!hasWebGL);
  const [sceneReady, setSceneReady] = useState(!hasWebGL);
  const markCanvasReady = useCallback(() => setCanvasReady(true), []);
  const markSceneReady = useCallback(() => setSceneReady(true), []);

  return (
    <main className="app-shell">
      <section className="room-stage" aria-label="可交互三维房间">
        {hasWebGL ? (
          <RoomCanvas onCanvasReady={markCanvasReady} onSceneReady={markSceneReady} />
        ) : (
          <RoomFallback />
        )}
        <DollWords />
        <WeatherPopover />
        <NowPlaying />
      </section>

      <ProfileDialog />
      <DoorExitDialog />
      <LinkDialog />
      <FeedDialog />
      <MusicDialog />
      <SearchDialog />
      <MusicBootstrap />
      <RoomLoader canvasReady={canvasReady} sceneReady={sceneReady} />
    </main>
  );
}

export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <RoomExperience />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
