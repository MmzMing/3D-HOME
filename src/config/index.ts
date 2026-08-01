import { z } from 'zod';

import appData from './app.json';
import feedsData from './feeds.json';
import linksData from './links.json';
import musicData from './music.json';
import profileData from './profile.json';
import searchData from './search.json';
import siteRecordsData from './site-records.json';
import themeData from './theme.json';
import weatherData from './weather.json';

const httpsUrl = z.url().refine((value) => new URL(value).protocol === 'https:');
const localAsset = z.string().regex(/^\/assets\//);

const appSchema = z.object({
  defaultCameraZone: z.enum(['overview', 'workspace', 'lounge']),
  name: z.string().min(1),
  owner: z.string().min(1),
});

const linkSchema = z.object({
  ctaLabel: z.string().min(1),
  description: z.string().min(1),
  id: z.string().regex(/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/),
  image: localAsset,
  tags: z.array(z.string().min(1)),
  title: z.string().min(1),
  url: httpsUrl,
});

const profileSchema = z.object({
  avatar: localAsset,
  bio: z.string(),
  experience: z.array(
    z.object({
      organization: z.string().min(1),
      period: z.string().min(1),
      role: z.string().min(1),
      summary: z.string().min(1),
    }),
  ),
  github: z.object({ username: z.string().min(1) }),
  intro: z.object({
    audioPhrases: z
      .array(z.object({ phrase: z.string(), track: localAsset }))
      .optional()
      .default([]),
    dollFonts: z
      .array(z.object({ family: z.string().min(1), src: localAsset }))
      .min(1)
      .optional()
      .default([
        { family: 'Ark Pixel', src: '/assets/fonts/ark-pixel-12px-proportional-zh-cn.woff' },
      ]),
    role: z.string().min(1),
    sticker: localAsset,
  }),
  name: z.string().min(1),
  skills: z.array(
    z.object({ color: z.string().optional(), icon: z.string().min(1), name: z.string().min(1) }),
  ),
  socialLinks: z.array(
    z.object({ color: z.string().optional(), label: z.string(), url: httpsUrl }),
  ),
});

const feedSchema = z.object({
  avatar: httpsUrl.optional(),
  defaultFetch: z.boolean(),
  enabled: z.boolean(),
  feedUrl: httpsUrl,
  id: z.string().regex(/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/),
  name: z.string().min(1),
  siteUrl: httpsUrl,
  tags: z.array(z.string().min(1)),
});

const musicSchema = z.object({
  local: z.object({
    playlist: z.array(
      z.object({
        artist: z.string(),
        cover: localAsset.optional(),
        lrc: z.string(),
        name: z.string(),
        url: localAsset,
      }),
    ),
  }),
  meting: z.object({
    api: httpsUrl,
    auth: z.string(),
    fallbackApis: z.array(httpsUrl),
    id: z.string().min(1),
    server: z.enum(['netease', 'tencent', 'kugou', 'xiami', 'baidu']),
    type: z.enum(['song', 'playlist', 'album', 'search', 'artist']),
  }),
  mode: z.enum(['meting', 'local']),
  playMode: z.enum(['list', 'one', 'random']),
  showLyrics: z.boolean(),
  volume: z.number().min(0).max(1),
});

const commandItem = z.object({
  command: z.enum(['overview', 'open-profile', 'focus-bookshelf', 'open-music']),
  icon: z.string().optional(),
  id: z.string(),
  kind: z.literal('command'),
  label: z.string(),
});
const externalItem = z.object({
  icon: z.string().optional(),
  id: z.string(),
  kind: z.literal('external'),
  label: z.string(),
  searchTemplate: httpsUrl.optional(),
  url: httpsUrl,
});
const searchSchema = z.object({
  scopes: z.array(
    z.object({
      icon: z.string(),
      id: z.string(),
      items: z.array(z.discriminatedUnion('kind', [commandItem, externalItem])),
      label: z.string(),
      placeholder: z.string(),
    }),
  ),
});

const siteRecordLinkSchema = z.object({
  label: z.string().min(1),
  url: httpsUrl,
});
const siteRecordsSchema = z.object({
  copyright: z.string().min(1),
  icp: siteRecordLinkSchema,
  police: siteRecordLinkSchema.extend({ icon: localAsset }),
});

const themeSchema = z.object({
  defaultMode: z.enum(['light', 'dark']),
  soundStorageKey: z.string(),
  themeStorageKey: z.string(),
});

const weatherSchema = z.object({
  language: z.enum(['zh', 'en']),
  provider: z.literal('qweather'),
  refreshIntervalMs: z.number().int().min(60_000).max(3_600_000),
  unit: z.enum(['m', 'i']),
});

export const appConfig = appSchema.parse(appData);
export const feedsConfig = z.array(feedSchema).parse(feedsData);
export const linksConfig = z.array(linkSchema).parse(linksData);
export const musicConfig = musicSchema.parse(musicData);
export const profileConfig = profileSchema.parse(profileData);
export const searchConfig = searchSchema.parse(searchData);
export const siteRecordsConfig = siteRecordsSchema.parse(siteRecordsData);
export const themeConfig = themeSchema.parse(themeData);
export const weatherConfig = weatherSchema.parse(weatherData);

export type FeedConfig = z.infer<typeof feedSchema>;
export type LinkConfig = z.infer<typeof linkSchema>;
export type MusicConfig = z.infer<typeof musicSchema>;
export type ProfileConfig = z.infer<typeof profileSchema>;
export type SearchConfig = z.infer<typeof searchSchema>;
