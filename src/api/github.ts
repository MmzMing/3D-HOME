import { z } from 'zod';

import { requestApi } from '@/api/http';

const contributionSchema = z.object({
  count: z.number().int().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  level: z.number().int().min(0).max(4),
});

const githubSchema = z.object({
  contributions: z.array(contributionSchema),
  languages: z.array(
    z.object({
      bytes: z.number().nonnegative(),
      color: z.string().nullable(),
      name: z.string().min(1),
    }),
  ),
  profile: z.object({
    avatarUrl: z.url(),
    bio: z.string().nullable(),
    followers: z.number().int().nonnegative(),
    following: z.number().int().nonnegative(),
    login: z.string().min(1),
    name: z.string().nullable(),
    publicRepositories: z.number().int().nonnegative(),
    url: z.url(),
  }),
  repositories: z.array(
    z.object({
      description: z.string().nullable(),
      forks: z.number().int().nonnegative(),
      language: z.string().nullable(),
      name: z.string().min(1),
      stars: z.number().int().nonnegative(),
      updatedAt: z.iso.datetime(),
      url: z.url(),
    }),
  ),
});

export type GitHubData = z.infer<typeof githubSchema>;

export function getGitHubData() {
  return requestApi('/api/github', githubSchema);
}
