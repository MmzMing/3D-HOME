import { ExternalLink } from 'lucide-react';

import type { LinkConfig } from '@/config';

export function LinkDetailCard({ link }: { link: LinkConfig }) {
  return (
    <article className="link-detail-card">
      <img src={link.image} alt="" />
      <div>
        <div className="tag-list">
          {link.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <h2>{link.title}</h2>
        <p>{link.description}</p>
        <a className="primary-action" href={link.url} target="_blank" rel="noopener noreferrer">
          {link.ctaLabel}
          <ExternalLink aria-hidden="true" size={16} />
        </a>
      </div>
    </article>
  );
}
