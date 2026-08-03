import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { RoomLoader } from '@/components/common/room-loader';
import { siteConfig } from '@/config';
import { FeedDialog } from '@/features/feeds';
import { DoorExitDialog } from '@/features/door-exit';
import { GitHubDialog } from '@/features/github';
import { LinkDialog } from '@/features/links';
import { FloatingMusicPlayer, MusicBootstrap } from '@/features/music';
import { ProfileDialog } from '@/features/profile';
import { SearchDialog } from '@/features/search';
import { WeatherPopover } from '@/features/weather';
import { RoomCanvas, RoomFallback } from '@/scene';
import { preloadProfileAudio } from '@/utils/room-audio';
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
  const [dollWordsReady, setDollWordsReady] = useState(!hasWebGL);
  const [profileAudioReady, setProfileAudioReady] = useState(!hasWebGL);
  const [roomRevealed, setRoomRevealed] = useState(false);
  const [roomSettled, setRoomSettled] = useState(false);
  const [sceneReady, setSceneReady] = useState(!hasWebGL);
  const markCanvasReady = useCallback(() => setCanvasReady(true), []);
  const markDollWordsReady = useCallback(() => setDollWordsReady(true), []);
  const revealRoom = useCallback(() => setRoomRevealed(true), []);
  const markSceneReady = useCallback(() => setSceneReady(true), []);

  useEffect(() => {
    if (!hasWebGL) return;
    let cancelled = false;
    void preloadProfileAudio().finally(() => {
      if (!cancelled) setProfileAudioReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hasWebGL]);

  useEffect(() => {
    if (!roomRevealed || roomSettled) return;
    const fallback = window.setTimeout(() => setRoomSettled(true), 560);
    return () => window.clearTimeout(fallback);
  }, [roomRevealed, roomSettled]);

  return (
    <main className="app-shell">
      <h1 className="visually-hidden">{siteConfig.siteName}</h1>
      <p className="visually-hidden">{siteConfig.description}</p>
      <section
        className="room-stage"
        data-revealed={roomRevealed ? 'true' : 'false'}
        data-settled={roomSettled ? 'true' : 'false'}
        onTransitionEnd={(event) => {
          if (event.currentTarget === event.target && event.propertyName === 'opacity') {
            setRoomSettled(true);
          }
        }}
        aria-label="可交互三维房间"
      >
        {hasWebGL ? (
          <RoomCanvas
            onCanvasReady={markCanvasReady}
            onDollWordsReady={markDollWordsReady}
            onSceneReady={markSceneReady}
          />
        ) : (
          <RoomFallback />
        )}
        <WeatherPopover />
        <FloatingMusicPlayer />
      </section>

      <ProfileDialog />
      <GitHubDialog />
      <DoorExitDialog />
      <LinkDialog />
      <FeedDialog />
      <SearchDialog />
      <MusicBootstrap />
      <RoomLoader
        canvasReady={canvasReady}
        onReveal={revealRoom}
        sceneReady={sceneReady && dollWordsReady && profileAudioReady}
      />
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
