import { z } from 'zod';

import { requestApi } from '@/api/http';

const trackSchema = z.object({
  artist: z.string(),
  audio: z.url(),
  cover: z.url().optional(),
  id: z.string(),
  lyrics: z.string().optional(),
  title: z.string(),
});

const playlistSchema = z.object({ tracks: z.array(trackSchema) });

export type RemoteMusicTrack = z.infer<typeof trackSchema>;

export function getMusic() {
  return requestApi('/api/music', playlistSchema);
}
