import { z } from 'zod';

import profileConfigData from '../../config/profile.json' with { type: 'json' };

import {
  createRequestId,
  failure,
  fetchWithTimeout,
  getEdgeCache,
  success,
  type EdgeContext,
} from './shared.ts';

const profileConfigSchema = z.object({
  github: z.object({
    username: z.string().regex(/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i),
  }),
});

const repositorySchema = z.object({
  description: z.string().nullable(),
  forkCount: z.number().int().nonnegative(),
  name: z.string().min(1),
  primaryLanguage: z.object({ name: z.string().min(1) }).nullable(),
  stargazerCount: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime(),
  url: z.url(),
});

const graphQlResponseSchema = z.object({
  data: z.object({
    user: z.object({
      avatarUrl: z.url(),
      bio: z.string().nullable(),
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({
                  contributionCount: z.number().int().nonnegative(),
                  contributionLevel: z.enum([
                    'NONE',
                    'FIRST_QUARTILE',
                    'SECOND_QUARTILE',
                    'THIRD_QUARTILE',
                    'FOURTH_QUARTILE',
                  ]),
                  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                }),
              ),
            }),
          ),
        }),
      }),
      followers: z.object({ totalCount: z.number().int().nonnegative() }),
      following: z.object({ totalCount: z.number().int().nonnegative() }),
      login: z.string().min(1),
      name: z.string().nullable(),
      pinnedItems: z.object({ nodes: z.array(repositorySchema) }),
      publicRepositories: z.object({ totalCount: z.number().int().nonnegative() }),
      repositories: z.object({ nodes: z.array(repositorySchema) }),
      url: z.url(),
    }),
  }),
});

const contributionLevels = {
  FIRST_QUARTILE: 1,
  FOURTH_QUARTILE: 4,
  NONE: 0,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
} as const;

const query = `query GitHubPanel($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login avatarUrl url name bio
    followers { totalCount }
    following { totalCount }
    publicRepositories: repositories(privacy: PUBLIC) { totalCount }
    repositories(first: 6, privacy: PUBLIC, ownerAffiliations: OWNER, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes { name description url stargazerCount forkCount updatedAt primaryLanguage { name } }
    }
    pinnedItems(first: 6, types: [REPOSITORY]) {
      nodes { ... on Repository { name description url stargazerCount forkCount updatedAt primaryLanguage { name } } }
    }
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar { weeks { contributionDays { date contributionCount contributionLevel } } }
    }
  }
}`;

export async function handleGithubGet(context: EdgeContext) {
  const requestId = createRequestId();
  const profile = profileConfigSchema.safeParse(profileConfigData);
  const token = context.env.GITHUB_TOKEN;
  if (!profile.success || token === undefined || token.length === 0) {
    return failure('provider-unavailable', 'GitHub 服务尚未配置。', requestId, false, 503);
  }

  const cacheKey = new Request(context.request.url);
  const cached = await getEdgeCache().match(cacheKey);
  if (cached !== undefined) return cached;

  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 364);

  try {
    const upstream = await fetchWithTimeout(
      new URL('https://api.github.com/graphql'),
      {
        body: JSON.stringify({
          query,
          variables: {
            from: from.toISOString(),
            login: profile.data.github.username,
            to: to.toISOString(),
          },
        }),
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'user-agent': '3d-home-edge-function',
        },
        method: 'POST',
      },
      5_000,
    );
    const payload: unknown = await upstream.json();
    const parsed = graphQlResponseSchema.safeParse(payload);
    if (!upstream.ok || !parsed.success) {
      return failure('provider-unavailable', 'GitHub 数据暂时不可用。', requestId, true, 502);
    }

    const user = parsed.data.data.user;
    const repositories =
      user.pinnedItems.nodes.length > 0 ? user.pinnedItems.nodes : user.repositories.nodes;
    const languageCounts = new Map<string, number>();
    repositories.forEach((repository) => {
      const language = repository.primaryLanguage?.name;
      if (language !== undefined)
        languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
    });

    const response = success(
      {
        contributions: user.contributionsCollection.contributionCalendar.weeks.flatMap((week) =>
          week.contributionDays.map((day) => ({
            count: day.contributionCount,
            date: day.date,
            level: contributionLevels[day.contributionLevel],
          })),
        ),
        languages: [...languageCounts.entries()]
          .map(([name, bytes]) => ({ bytes, color: null, name }))
          .sort((left, right) => right.bytes - left.bytes),
        profile: {
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          followers: user.followers.totalCount,
          following: user.following.totalCount,
          login: user.login,
          name: user.name,
          publicRepositories: user.publicRepositories.totalCount,
          url: user.url,
        },
        repositories: repositories.map((repository) => ({
          description: repository.description,
          forks: repository.forkCount,
          language: repository.primaryLanguage?.name ?? null,
          name: repository.name,
          stars: repository.stargazerCount,
          updatedAt: repository.updatedAt,
          url: repository.url,
        })),
      },
      requestId,
    );
    context.waitUntil(getEdgeCache().put(cacheKey, response.clone()));
    return response;
  } catch {
    return failure('provider-unavailable', 'GitHub 数据暂时不可用。', requestId, true, 502);
  }
}
