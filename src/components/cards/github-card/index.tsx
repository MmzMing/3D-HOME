import { ExternalLink, GitFork, Star } from 'lucide-react';

import type { GitHubData } from '@/api';

import { ContributionHeatmap } from './contribution-heatmap';

export function GitHubCard({ data }: { data: GitHubData }) {
  return (
    <section className="github-card" aria-labelledby="github-card-title">
      <div className="github-summary">
        <img src={data.profile.avatarUrl} alt="" />
        <div>
          <p className="eyebrow">GITHUB</p>
          <h2 id="github-card-title">{data.profile.name ?? data.profile.login}</h2>
          <a href={data.profile.url} target="_blank" rel="noopener noreferrer">
            @{data.profile.login}
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        </div>
        <dl>
          <div>
            <dt>仓库</dt>
            <dd>{data.profile.publicRepositories}</dd>
          </div>
          <div>
            <dt>关注者</dt>
            <dd>{data.profile.followers}</dd>
          </div>
          <div>
            <dt>关注</dt>
            <dd>{data.profile.following}</dd>
          </div>
        </dl>
      </div>
      <ContributionHeatmap contributions={data.contributions} />
      <div className="repository-list">
        {data.repositories.map((repo) => (
          <article key={repo.url}>
            <a href={repo.url} target="_blank" rel="noopener noreferrer">
              {repo.name}
            </a>
            {repo.description === null ? null : <p>{repo.description}</p>}
            <footer>
              <span>{repo.language ?? '未标注'}</span>
              <span>
                <Star aria-hidden="true" size={13} />
                {repo.stars}
              </span>
              <span>
                <GitFork aria-hidden="true" size={13} />
                {repo.forks}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
