// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getGitHubData } from '@/api/github';
import { getWeather } from '@/api/weather';

const meta = {
  cachedAt: '2026-07-31T00:00:00.000Z',
  requestId: 'request-1',
  stale: false,
};

const forecast = Array.from({ length: 7 }, (_, index) => ({
  date: `2026-08-0${(index + 1).toString()}`,
  icon: '100',
  temperatureMax: '31',
  temperatureMin: '24',
  text: '晴',
}));

const weather = {
  current: {
    feelsLike: '31',
    humidity: '63',
    icon: '100',
    observedAt: '2026-07-31T08:00:00+08:00',
    temperature: '30',
    text: '晴',
    visibility: '20',
    windDirection: '东南风',
    windScale: '2',
  },
  forecast,
  location: { city: '上海市', region: '上海市' },
};

const github = {
  contributions: [{ count: 2, date: '2026-07-31', level: 1 }],
  languages: [{ bytes: 3, color: null, name: 'TypeScript' }],
  profile: {
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    bio: null,
    followers: 2,
    following: 3,
    login: 'MmzMing',
    name: 'Ming',
    publicRepositories: 4,
    url: 'https://github.com/MmzMing',
  },
  repositories: [
    {
      description: null,
      forks: 1,
      language: 'TypeScript',
      name: '3D-home',
      stars: 2,
      updatedAt: '2026-07-31T00:00:00.000Z',
      url: 'https://github.com/MmzMing/3D-home',
    },
  ],
};

function respondWith(data: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify({ data, meta }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    }),
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('weather API contract', () => {
  it('accepts the complete provider response', async () => {
    respondWith(weather);

    await expect(getWeather()).resolves.toMatchObject({ data: weather });
  });

  it('rejects an incomplete seven-day forecast', async () => {
    respondWith({ ...weather, forecast: forecast.slice(0, 6) });

    await expect(getWeather()).rejects.toMatchObject({ code: 'invalid-response' });
  });
});

describe('GitHub API contract', () => {
  it('accepts the complete provider response', async () => {
    respondWith(github);

    await expect(getGitHubData()).resolves.toMatchObject({ data: github });
  });

  it('rejects a repository with an invalid update timestamp', async () => {
    respondWith({
      ...github,
      repositories: [{ ...github.repositories[0], updatedAt: 'not-a-timestamp' }],
    });

    await expect(getGitHubData()).rejects.toMatchObject({ code: 'invalid-response' });
  });
});
