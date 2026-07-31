import { create } from 'zustand';

import { musicConfig } from '@/config';

export interface MusicTrack {
  artist: string;
  audio: string;
  cover?: string | undefined;
  id: string;
  lyrics?: string | undefined;
  title: string;
}

export type PlaybackMode = 'list' | 'loop' | 'shuffle';
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface PlayerState {
  currentIndex: number;
  duration: number;
  error: string | null;
  hasStarted: boolean;
  mode: PlaybackMode;
  progress: number;
  status: PlaybackStatus;
  tracks: readonly MusicTrack[];
  volume: number;
  initialize: () => void;
  next: () => void;
  pause: () => void;
  play: () => void;
  previous: () => void;
  seek: (value: number) => void;
  selectTrack: (index: number) => void;
  setTracks: (tracks: readonly MusicTrack[]) => void;
  setVolume: (volume: number) => void;
  cycleMode: () => void;
}

let audio: HTMLAudioElement | null = null;
let listenersAttached = false;

function element() {
  audio ??= new Audio();
  audio.preload = 'metadata';
  return audio;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const select = (index: number, autoplay: boolean) => {
    const track = get().tracks[index];
    if (track === undefined) return;
    const player = element();
    player.src = track.audio;
    player.load();
    set({
      currentIndex: index,
      error: null,
      hasStarted: autoplay || get().hasStarted,
      progress: 0,
      status: autoplay ? 'loading' : 'paused',
    });
    if (autoplay) {
      void player
        .play()
        .catch(() => set({ error: '浏览器阻止了播放，请再次点击。', status: 'error' }));
    }
  };

  const nextIndex = () => {
    const state = get();
    if (state.tracks.length === 0) return 0;
    if (state.mode === 'shuffle') {
      const candidate = Math.floor(Math.random() * state.tracks.length);
      return candidate === state.currentIndex ? (candidate + 1) % state.tracks.length : candidate;
    }
    return (state.currentIndex + 1) % state.tracks.length;
  };

  return {
    currentIndex: 0,
    duration: 0,
    error: null,
    hasStarted: false,
    mode:
      musicConfig.playMode === 'one'
        ? 'loop'
        : musicConfig.playMode === 'random'
          ? 'shuffle'
          : 'list',
    progress: 0,
    status: 'idle',
    tracks: [],
    volume: musicConfig.volume,
    initialize: () => {
      if (listenersAttached) return;
      const player = element();
      player.volume = get().volume;
      player.addEventListener('durationchange', () =>
        set({ duration: Number.isFinite(player.duration) ? player.duration : 0 }),
      );
      player.addEventListener('timeupdate', () => set({ progress: player.currentTime }));
      player.addEventListener('play', () => set({ status: 'playing' }));
      player.addEventListener('pause', () => set({ status: player.ended ? 'idle' : 'paused' }));
      player.addEventListener('ended', () => {
        if (get().mode === 'loop') {
          player.currentTime = 0;
          void player.play();
        } else {
          select(nextIndex(), true);
        }
      });
      player.addEventListener('error', () => set({ error: '当前曲目无法播放。', status: 'error' }));
      listenersAttached = true;
    },
    next: () => select(nextIndex(), true),
    pause: () => element().pause(),
    play: () => {
      if (get().tracks.length === 0) {
        set({ error: '播放列表暂不可用。', hasStarted: true, status: 'error' });
        return;
      }
      const player = element();
      set({ error: null, hasStarted: true, status: 'loading' });
      if (player.src.length === 0) select(get().currentIndex, true);
      else
        void player
          .play()
          .catch(() => set({ error: '浏览器阻止了播放，请再次点击。', status: 'error' }));
    },
    previous: () => {
      const state = get();
      if (state.tracks.length > 0)
        select((state.currentIndex - 1 + state.tracks.length) % state.tracks.length, true);
    },
    seek: (value) => {
      const player = element();
      player.currentTime = clamp(value, 0, Number.isFinite(player.duration) ? player.duration : 0);
    },
    selectTrack: (index) => select(index, true),
    setTracks: (tracks) => {
      element().pause();
      set({
        currentIndex: 0,
        duration: 0,
        error: null,
        hasStarted: false,
        progress: 0,
        status: 'idle',
        tracks,
      });
      if (tracks.length > 0) select(0, false);
    },
    setVolume: (volume) => {
      const next = clamp(volume, 0, 1);
      element().volume = next;
      set({ volume: next });
    },
    cycleMode: () =>
      set((state) => ({
        mode: state.mode === 'list' ? 'loop' : state.mode === 'loop' ? 'shuffle' : 'list',
      })),
  };
});
