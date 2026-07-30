import { z } from 'zod';

import musicConfigData from '../../config/music.json' with { type: 'json' };

import { createRequestId, failure, fetchWithTimeout, success } from './shared.ts';

const httpsUrl = z.url().refine((value) => new URL(value).protocol === 'https:');

const musicConfigSchema = z.object({
  local: z.object({
    playlist: z.array(
      z.object({
        artist: z.string(),
        cover: z.string().optional(),
        lrc: z.string(),
        name: z.string(),
        url: z.string(),
      }),
    ),
  }),
  meting: z.object({
    api: httpsUrl,
    auth: z.string(),
    fallbackApis: z.array(httpsUrl),
    id: z.string().min(1),
    server: z.string().min(1),
    type: z.string().min(1),
  }),
  mode: z.enum(['meting', 'local']),
});

const metingTrackSchema = z.object({
  author: z.string().min(1),
  lrc: httpsUrl.optional(),
  pic: httpsUrl.optional(),
  title: z.string().min(1),
  url: httpsUrl,
});

const metingPlaylistSchema = z.array(metingTrackSchema).min(1).max(500);

function providerUrl(template: string, config: z.infer<typeof musicConfigSchema>['meting']) {
  const replacements: Record<string, string> = {
    ':auth': config.auth,
    ':id': config.id,
    ':r': Math.random().toString(36).slice(2),
    ':server': config.server,
    ':type': config.type,
  };
  const value = Object.entries(replacements).reduce(
    (url, [token, replacement]) => url.replaceAll(token, encodeURIComponent(replacement)),
    template,
  );
  return new URL(value);
}

function trackId(audioUrl: string, index: number) {
  return new URL(audioUrl).searchParams.get('id') ?? `track-${(index + 1).toString()}`;
}

async function requestMeting(
  template: string,
  config: z.infer<typeof musicConfigSchema>['meting'],
) {
  const response = await fetchWithTimeout(
    providerUrl(template, config),
    { headers: { accept: 'application/json' } },
    7_000,
  );
  if (!response.ok) return null;
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > 1_500_000) return null;
  const payload: unknown = await response.json().catch(() => null);
  const parsed = metingPlaylistSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export async function handleMusicGet() {
  const requestId = createRequestId();
  const config = musicConfigSchema.safeParse(musicConfigData);
  if (!config.success) {
    return failure('invalid-config', '音乐配置无效。', requestId, false, 500);
  }

  if (config.data.mode === 'local') {
    const tracks = config.data.local.playlist.map((track, index) => ({
      artist: track.artist,
      audio: track.url,
      cover: track.cover,
      id: `local-${(index + 1).toString()}`,
      lyrics: track.lrc,
      title: track.name,
    }));
    return success({ tracks }, requestId);
  }

  const providers = [config.data.meting.api, ...config.data.meting.fallbackApis];
  for (const provider of providers) {
    try {
      const playlist = await requestMeting(provider, config.data.meting);
      if (playlist === null) continue;
      return success(
        {
          tracks: playlist.map((track, index) => ({
            artist: track.author,
            audio: track.url,
            cover: track.pic,
            id: trackId(track.url, index),
            lyrics: track.lrc,
            title: track.title,
          })),
        },
        requestId,
        { headers: { 'cache-control': 's-maxage=1800, stale-while-revalidate=3600' } },
      );
    } catch {
      continue;
    }
  }

  return failure('provider-unavailable', '音乐服务暂时不可用。', requestId, true, 502);
}
