import { useEffect, useRef } from 'react';

import { usePlayerStore } from '@/stores/player-store';
import { useRoomStore } from '@/stores/room-store';

interface LyricLine {
  time: number;
  text: string;
}

const lrcCache = new Map<string, LyricLine[] | null>();
const timestampPattern = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

function parseLrc(content: string): LyricLine[] {
  const lines = content.split(/\r?\n/);
  const result: LyricLine[] = [];
  for (const line of lines) {
    const times: number[] = [];
    timestampPattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = timestampPattern.exec(line)) !== null) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fractionRaw = match[3];
      const fraction = fractionRaw ? Number(fractionRaw) / Math.pow(10, fractionRaw.length) : 0;
      times.push(minutes * 60 + seconds + fraction);
    }
    if (times.length === 0) continue;
    const text = line.replace(timestampPattern, '').trim();
    if (text.length === 0) continue;
    for (const time of times) result.push({ time, text });
  }
  return result.sort((a, b) => a.time - b.time);
}

function isUrlLike(value: string) {
  return /^(https?:)?\//.test(value);
}

async function loadLyrics(source: string): Promise<LyricLine[] | null> {
  if (lrcCache.has(source)) return lrcCache.get(source) ?? null;
  try {
    let content: string;
    if (isUrlLike(source)) {
      const response = await fetch(source);
      if (!response.ok) {
        lrcCache.set(source, null);
        return null;
      }
      content = await response.text();
    } else {
      content = source;
    }
    const parsed = parseLrc(content);
    const result = parsed.length > 0 ? parsed : null;
    lrcCache.set(source, result);
    return result;
  } catch {
    lrcCache.set(source, null);
    return null;
  }
}

/**
 * 将音乐歌词接入 3D 米塔字体：播放进度跨过某行歌词时触发一次释放。
 * 当前曲目没有 lyrics（或解析失败、showLyrics 关闭）时静默不调用。
 */
export function useLyricsDollWords() {
  const tracks = usePlayerStore((state) => state.tracks);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const progress = usePlayerStore((state) => state.progress);
  const status = usePlayerStore((state) => state.status);
  const showLyrics = usePlayerStore((state) => state.showLyrics);
  const releaseDollWords = useRoomStore((state) => state.releaseDollWords);

  const lyricsRef = useRef<LyricLine[] | null>(null);
  const lastFiredIndexRef = useRef(-1);
  const currentSourceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showLyrics) {
      lyricsRef.current = null;
      lastFiredIndexRef.current = -1;
      currentSourceRef.current = null;
      return;
    }
    const track = tracks[currentIndex];
    const source = track?.lyrics;
    if (source === currentSourceRef.current) return;
    currentSourceRef.current = source ?? null;
    lyricsRef.current = null;
    lastFiredIndexRef.current = -1;
    if (source === undefined) return;

    let cancelled = false;
    void loadLyrics(source).then((lines) => {
      if (cancelled || lines === null) return;
      lyricsRef.current = lines;
      const currentProgress = usePlayerStore.getState().progress;
      let idx = -1;
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (line === undefined || line.time > currentProgress) break;
        idx = i;
      }
      // 设为 idx - 1 使当前行在下次 progress tick 时立即触发，
      // 避免歌曲中途开启歌词时要等到下一句才有反应
      lastFiredIndexRef.current = idx - 1;
    });
    return () => {
      cancelled = true;
    };
  }, [currentIndex, tracks, showLyrics]);

  useEffect(() => {
    if (!showLyrics || status !== 'playing') return;
    const lines = lyricsRef.current;
    if (lines === null || lines.length === 0) return;
    let target = -1;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line === undefined || line.time > progress) break;
      target = i;
    }
    if (target <= lastFiredIndexRef.current) {
      // seek 后退：同步游标但不重复触发已过行
      if (target < lastFiredIndexRef.current) lastFiredIndexRef.current = target;
      return;
    }
    const line = lines[target];
    if (line === undefined) return;
    lastFiredIndexRef.current = target;
    if (line.text.length > 0) releaseDollWords(line.text);
  }, [progress, status, showLyrics, releaseDollWords]);
}
