import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { FeedDialog } from '@/features/feeds';
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

  return (
    <main className="app-shell">
      <section className="room-stage" aria-label="可交互三维房间">
        {hasWebGL ? <RoomCanvas /> : <RoomFallback />}
        <WeatherPopover />
        <NowPlaying />
      </section>

      <ProfileDialog />
      <LinkDialog />
      <FeedDialog />
      <MusicDialog />
      <SearchDialog />
      <MusicBootstrap />
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
