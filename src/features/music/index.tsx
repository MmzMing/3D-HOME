import { useQuery } from '@tanstack/react-query';
import {
  ListMusic,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';
import { useEffect } from 'react';

import { getMusic } from '@/api';
import { TrackCard } from '@/components/cards/track-card';
import { ModalShell } from '@/components/common/modal-shell';
import { ErrorStatus } from '@/components/common/status-view';
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

export function NowPlaying() {
  const status = usePlayerStore((state) => state.status);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const tracks = usePlayerStore((state) => state.tracks);
  const openPanel = useRoomStore((state) => state.openPanel);
  const track = tracks[currentIndex];
  if (status === 'idle' || status === 'paused' || track === undefined) return null;
  return (
    <div className="now-playing" data-status={status}>
      <span>
        <small>NOW PLAYING</small>
        <strong>{track.title}</strong>
      </span>
      <button
        type="button"
        className="icon-button"
        aria-label="打开播放列表"
        title="播放列表"
        onClick={() => openPanel('music')}
      >
        <ListMusic aria-hidden="true" size={19} />
      </button>
    </div>
  );
}

export function MusicDialog() {
  const panel = useRoomStore((state) => state.panel);
  const closePanel = useRoomStore((state) => state.closePanel);
  const player = usePlayerStore();
  const track = player.tracks[player.currentIndex];
  const isPlaying = player.status === 'playing' || player.status === 'loading';
  const ModeIcon = player.mode === 'shuffle' ? Shuffle : Repeat;
  return (
    <ModalShell
      open={panel === 'music'}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
      title="留声机"
      description="播放列表与唱片控制"
    >
      {track === undefined ? (
        <ErrorStatus message={player.error ?? '播放列表暂不可用，请检查 EdgeOne 音乐接口。'} />
      ) : (
        <div className="music-layout">
          <section className="music-player" aria-label="播放器">
            <div className="music-heading">
              {track.cover === undefined ? (
                <span className="music-cover-placeholder">
                  <ListMusic aria-hidden="true" size={30} />
                </span>
              ) : (
                <img src={track.cover} alt="" />
              )}
              <div>
                <p className="eyebrow">NOW PLAYING</p>
                <h2>{track.title}</h2>
                <p>{track.artist}</p>
              </div>
            </div>
            <label className="range-control">
              <span>播放进度</span>
              <input
                type="range"
                min={0}
                max={Math.max(1, player.duration)}
                step={0.1}
                value={Math.min(player.progress, Math.max(1, player.duration))}
                onChange={(event) => player.seek(Number(event.currentTarget.value))}
              />
              <output>
                {formatTime(player.progress)} / {formatTime(player.duration)}
              </output>
            </label>
            <div className="player-controls">
              <button
                type="button"
                className="icon-button"
                aria-label={`播放模式：${player.mode}`}
                title="切换播放模式"
                onClick={player.cycleMode}
              >
                <ModeIcon aria-hidden="true" size={19} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="上一首"
                onClick={player.previous}
              >
                <SkipBack aria-hidden="true" size={21} />
              </button>
              <button
                type="button"
                className="play-button"
                aria-label={isPlaying ? '暂停' : '播放'}
                onClick={isPlaying ? player.pause : player.play}
              >
                {isPlaying ? (
                  <Pause aria-hidden="true" size={22} />
                ) : (
                  <Play aria-hidden="true" size={22} />
                )}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="下一首"
                onClick={player.next}
              >
                <SkipForward aria-hidden="true" size={21} />
              </button>
            </div>
            <label className="range-control volume-control">
              <Volume2 aria-hidden="true" size={17} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={player.volume}
                onChange={(event) => player.setVolume(Number(event.currentTarget.value))}
              />
              <output>{Math.round(player.volume * 100)}%</output>
            </label>
            {player.error === null ? null : (
              <p className="feature-error" role="status">
                {player.error}
              </p>
            )}
          </section>
          <section className="playlist" aria-labelledby="playlist-title">
            <h2 id="playlist-title">播放列表</h2>
            <div>
              {player.tracks.map((item, index) => (
                <TrackCard
                  key={item.id}
                  track={item}
                  active={index === player.currentIndex}
                  onSelect={() => player.selectTrack(index)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </ModalShell>
  );
}
