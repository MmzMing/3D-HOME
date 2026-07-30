import { ExternalLink } from 'lucide-react';

import type { ProfileConfig } from '@/config';

export function ProfileCard({ profile }: { profile: ProfileConfig }) {
  return (
    <section className="profile-card" aria-labelledby="profile-card-title">
      <div className="profile-card-heading">
        <img src={profile.avatar} alt={`${profile.name} 的头像`} />
        <div>
          <p className="eyebrow">ABOUT</p>
          <h2 id="profile-card-title">{profile.name}</h2>
          <strong>{profile.intro.role}</strong>
        </div>
      </div>
      <p className="profile-bio">{profile.bio}</p>
      <div className="profile-socials" aria-label="社交链接">
        {profile.socialLinks.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
            {link.label}
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        ))}
      </div>
      <section className="profile-skills" aria-labelledby="skills-title">
        <h3 id="skills-title">技术栈</h3>
        <ul>
          {profile.skills.map((skill) => (
            <li key={skill.name}>
              <span />
              {skill.name}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
