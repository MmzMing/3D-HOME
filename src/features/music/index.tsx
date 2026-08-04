import { useQuery } from '@tanstack/react-query';
import {
  Captions,
  ListMusic,
  Lock,
  Minimize2,
  Music2,
  Pause,
  Play,
  Repeat1,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Unlock,
  Volume2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getMusic } from '@/api';
import { TrackCard } from '@/components/cards/track-card';
import { useLyricsDollWords } from '@/hooks/use-lyrics-doll-words';
import { usePlayerStore } from '@/stores/player-store';
import { useRoomStore } from '@/stores/room-store';

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${String(minutes)}:${seconds}`;
}

export function MusicBootstrap() {
  const initialize = usePlayerStore((state) => state.initialize);
  const setTracks = usePlayerStore((state) => state.setTracks);
  useLyricsDollWords();
  const music = useQuery({
    queryFn: getMusic,
    queryKey: ['music'],
    staleTime: 15 * 60_000,
    retry: 1,
  });
  useEffect(() => initialize(), [initialize]);
  useEffect(() => {
    if (music.data !== undefined) setTracks(music.data.data.tracks);
  }, [music.data, setTracks]);
  return null;
}

const modeLabels = {
  list: '列表循环',
  loop: '单曲循环',
  shuffle: '随机播放',
} as const;

const AUTO_COLLAPSE_DELAY = 5_000;

function hasHoverPointer() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function FloatingMusicPlayer() {
  const player = usePlayerStore();
  const panel = useRoomStore((state) => state.panel);
  const closePanel = useRoomStore((state) => state.closePanel);
  const openPanel = useRoomStore((state) => state.openPanel);
  const showLyrics = usePlayerStore((state) => state.showLyrics);
  const toggleLyrics = usePlayerStore((state) => state.toggleLyrics);
  const [isCollapsed, setCollapsed] = useState(false);
  const [isAutoCollapseLocked, setAutoCollapseLocked] = useState(false);
  const [isVolumeOpen, setVolumeOpen] = useState(false);
  const collapseTimerRef = useRef<number | null>(null);
  const playerStackRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const track = player.tracks[player.currentIndex];
  const isPlaying = player.status === 'playing' || player.status === 'loading';
  const isPlaylistOpen = panel === 'music';
  const modeLabel = modeLabels[player.mode];
  const volumePercent = Math.round(player.volume * 100);
  const ModeIcon = player.mode === 'shuffle' ? Shuffle : player.mode === 'loop' ? Repeat1 : Repeat2;
  const isVisuallyCollapsed = isCollapsed && !isPlaylistOpen && !isVolumeOpen;

  const clearAutoCollapse = useCallback(() => {
    if (collapseTimerRef.current === null) return;
    window.clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = null;
  }, []);

  const scheduleAutoCollapse = useCallback(() => {
    clearAutoCollapse();
    if (!player.hasStarted || isAutoCollapseLocked || isPlaylistOpen || isVolumeOpen) return;
    collapseTimerRef.current = window.setTimeout(() => {
      setCollapsed(true);
      collapseTimerRef.current = null;
    }, AUTO_COLLAPSE_DELAY);
  }, [clearAutoCollapse, isAutoCollapseLocked, isPlaylistOpen, isVolumeOpen, player.hasStarted]);

  const closePlaylistAndKeepExpanded = useCallback(() => {
    setCollapsed(false);
    closePanel();
  }, [closePanel]);

  useEffect(() => {
    if (!isVolumeOpen) return;
    const closeVolume = (event: PointerEvent) => {
      if (!volumeRef.current?.contains(event.target as Node)) setVolumeOpen(false);
    };
    document.addEventListener('pointerdown', closeVolume);
    return () => document.removeEventListener('pointerdown', closeVolume);
  }, [isVolumeOpen]);

  useEffect(() => {
    if (!isPlaylistOpen) return;
    const closePlaylist = (event: PointerEvent) => {
      if (!playerStackRef.current?.contains(event.target as Node)) {
        closePlaylistAndKeepExpanded();
      }
    };
    document.addEventListener('pointerdown', closePlaylist);
    return () => document.removeEventListener('pointerdown', closePlaylist);
  }, [closePlaylistAndKeepExpanded, isPlaylistOpen]);

  useEffect(() => {
    const closeFloatingControls = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setVolumeOpen(false);
      if (isPlaylistOpen) closePlaylistAndKeepExpanded();
    };
    document.addEventListener('keydown', closeFloatingControls);
    return () => document.removeEventListener('keydown', closeFloatingControls);
  }, [closePlaylistAndKeepExpanded, isPlaylistOpen]);

  useEffect(() => {
    if (!player.hasStarted || isAutoCollapseLocked || isPlaylistOpen || isVolumeOpen) {
      clearAutoCollapse();
      return;
    }
    scheduleAutoCollapse();
    return clearAutoCollapse;
  }, [
    clearAutoCollapse,
    isAutoCollapseLocked,
    isPlaylistOpen,
    isVolumeOpen,
    player.hasStarted,
    scheduleAutoCollapse,
  ]);

  if (!player.hasStarted && !isPlaylistOpen) return null;

  return (
    <>
      <div
        ref={playerStackRef}
        className="floating-player-stack"
        data-collapsed={isVisuallyCollapsed ? 'true' : 'false'}
        data-playlist-open={isPlaylistOpen ? 'true' : 'false'}
      >
        <section
          className="floating-player"
          aria-hidden={isVisuallyCollapsed}
          aria-label="音乐播放器"
          data-status={player.status}
          inert={isVisuallyCollapsed ? true : undefined}
          onPointerDown={() => {
            if (!hasHoverPointer()) scheduleAutoCollapse();
          }}
          onPointerEnter={() => {
            if (hasHoverPointer()) clearAutoCollapse();
          }}
          onPointerLeave={() => {
            if (hasHoverPointer()) scheduleAutoCollapse();
          }}
        >
          {track?.cover === undefined ? (
            <span className="floating-player-cover-placeholder">
              <Music2 aria-hidden="true" size={28} />
            </span>
          ) : (
            <img className="floating-player-cover" src={track.cover} alt={`${track.title} 封面`} />
          )}

          <div className="floating-player-body">
            <div className="floating-track-meta" aria-live="polite">
              <strong>{track?.title ?? '暂无可播放歌曲'}</strong>
              <span>{track?.artist ?? '音乐数据暂不可用'}</span>
            </div>

            <label className="floating-progress">
              <span className="visually-hidden">播放进度</span>
              <time>{formatTime(player.progress)}</time>
              <input
                type="range"
                min={0}
                max={Math.max(1, player.duration)}
                step={0.1}
                value={Math.min(player.progress, Math.max(1, player.duration))}
                disabled={track === undefined}
                onChange={(event) => player.seek(Number(event.currentTarget.value))}
              />
              <time>{formatTime(player.duration)}</time>
            </label>

            <div className="floating-player-controls">
              <button
                type="button"
                className="floating-player-button"
                aria-label={`播放模式：${modeLabel}`}
                title={`播放模式：${modeLabel}`}
                disabled={track === undefined}
                onClick={player.cycleMode}
              >
                <ModeIcon aria-hidden="true" size={19} />
              </button>
              <button
                type="button"
                className="floating-player-button"
                aria-label="上一首"
                title="上一首"
                disabled={track === undefined}
                onClick={player.previous}
              >
                <SkipBack aria-hidden="true" size={20} />
              </button>
              <button
                type="button"
                className="floating-player-button floating-player-play"
                aria-label={isPlaying ? '暂停' : '播放'}
                title={isPlaying ? '暂停' : '播放'}
                disabled={track === undefined}
                onClick={isPlaying ? player.pause : player.play}
              >
                {isPlaying ? (
                  <Pause aria-hidden="true" size={21} />
                ) : (
                  <Play aria-hidden="true" size={21} />
                )}
              </button>
              <button
                type="button"
                className="floating-player-button"
                aria-label="下一首"
                title="下一首"
                disabled={track === undefined}
                onClick={player.next}
              >
                <SkipForward aria-hidden="true" size={20} />
              </button>
              <div className="floating-player-volume" ref={volumeRef}>
                {isVolumeOpen ? (
                  <div className="volume-popover" id="player-volume-control">
                    <label>
                      <span className="visually-hidden">音量</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={player.volume}
                        onChange={(event) => player.setVolume(Number(event.currentTarget.value))}
                      />
                    </label>
                    <output>{volumePercent}%</output>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="floating-player-button"
                  aria-label="调节音量"
                  aria-controls="player-volume-control"
                  aria-expanded={isVolumeOpen}
                  title={`音量：${String(volumePercent)}%`}
                  onClick={() => setVolumeOpen((open) => !open)}
                >
                  <Volume2 aria-hidden="true" size={19} />
                </button>
              </div>
              <button
                type="button"
                className="floating-player-button"
                aria-label={showLyrics ? '关闭歌词' : '开启歌词'}
                aria-pressed={showLyrics}
                title={showLyrics ? '关闭歌词' : '开启歌词'}
                data-active={showLyrics ? 'true' : 'false'}
                disabled={track === undefined}
                onClick={toggleLyrics}
              >
                <Captions aria-hidden="true" size={20} />
              </button>
              <button
                type="button"
                className="floating-player-button"
                aria-label={isPlaylistOpen ? '收起播放列表' : '展开播放列表'}
                aria-expanded={isPlaylistOpen}
                aria-controls="floating-playlist"
                title="播放列表"
                onClick={() => {
                  setCollapsed(false);
                  if (isPlaylistOpen) closePlaylistAndKeepExpanded();
                  else openPanel('music');
                }}
              >
                <ListMusic aria-hidden="true" size={20} />
              </button>
              <button
                type="button"
                className="floating-player-button"
                aria-label="收缩为唱片"
                title="收缩为唱片"
                onClick={() => {
                  clearAutoCollapse();
                  setVolumeOpen(false);
                  if (isPlaylistOpen) closePanel();
                  setCollapsed(true);
                }}
              >
                <Minimize2 aria-hidden="true" size={20} />
              </button>
              <button
                type="button"
                className="floating-player-button"
                aria-label={
                  isAutoCollapseLocked ? '取消固定，恢复自动收缩' : '固定播放器，禁止自动收缩'
                }
                aria-pressed={isAutoCollapseLocked}
                title={isAutoCollapseLocked ? '取消固定，恢复自动收缩' : '固定播放器，禁止自动收缩'}
                data-active={isAutoCollapseLocked ? 'true' : 'false'}
                onClick={() => setAutoCollapseLocked((locked) => !locked)}
              >
                {isAutoCollapseLocked ? (
                  <Lock aria-hidden="true" size={19} />
                ) : (
                  <Unlock aria-hidden="true" size={19} />
                )}
              </button>
            </div>

            {player.error === null ? null : (
              <p className="floating-player-error" role="status">
                {player.error}
              </p>
            )}
          </div>
        </section>

        {isPlaylistOpen ? (
          <section
            className="floating-playlist"
            id="floating-playlist"
            aria-labelledby="playlist-title"
          >
            <header>
              <div>
                <h2 id="playlist-title">播放列表</h2>
                <span>{player.tracks.length} 首歌曲</span>
              </div>
              <button
                type="button"
                className="floating-player-button"
                aria-label="收起播放列表"
                title="收起播放列表"
                onClick={closePlaylistAndKeepExpanded}
              >
                <X aria-hidden="true" size={19} />
              </button>
            </header>
            {player.tracks.length === 0 ? (
              <p className="floating-playlist-empty">
                {player.error ?? '播放列表暂不可用，请稍后重试。'}
              </p>
            ) : (
              <div className="floating-playlist-tracks">
                {player.tracks.map((item, index) => (
                  <TrackCard
                    key={item.id}
                    track={item}
                    active={index === player.currentIndex}
                    onSelect={() => player.selectTrack(index)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>

      <button
        type="button"
        className="floating-record"
        aria-label="展开音乐播放器"
        data-playing={isPlaying ? 'true' : 'false'}
        data-visible={isVisuallyCollapsed ? 'true' : 'false'}
        title="展开音乐播放器"
        onClick={() => {
          setCollapsed(false);
          scheduleAutoCollapse();
        }}
      >
        <span className="floating-record-art" aria-hidden="true">
          {track?.cover === undefined ? (
            <span className="floating-record-placeholder">
              <Music2 size={24} />
            </span>
          ) : (
            <img src={track.cover} alt="" />
          )}
        </span>
        <span className="floating-record-center" aria-hidden="true" />
      </button>
    </>
  );
}
