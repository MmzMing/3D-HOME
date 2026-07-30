import { ExternalLink } from 'lucide-react';

import type { FeedArticle } from '@/api';

const formatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function FeedArticleCard({ article }: { article: FeedArticle }) {
  return (
    <article className="feed-article-card">
      <div className="feed-article-heading">
        <span>{article.sourceName}</span>
        {article.publishedAt === null ? null : (
          <time dateTime={article.publishedAt}>
            {formatter.format(new Date(article.publishedAt))}
          </time>
        )}
      </div>
      <h3>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          {article.title}
          <ExternalLink aria-hidden="true" size={14} />
        </a>
      </h3>
      {article.excerpt.length === 0 ? null : <p>{article.excerpt}</p>}
      <footer>
        {article.tags.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </footer>
    </article>
  );
}
