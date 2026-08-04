import { Code2, ExternalLink } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { IconType } from 'react-icons';
import { FaBilibili, FaGithub, FaQq } from 'react-icons/fa6';

import type { ProfileConfig } from '@/config';

import { resolveSkillIcon } from './skill-icons';

const socialIcons: Record<string, IconType> = {
  Bilibili: FaBilibili,
  GitHub: FaGithub,
  QQ群: FaQq,
};

export function ProfileCard({ profile }: { profile: ProfileConfig }) {
  return (
    <section className="profile-card" aria-labelledby="profile-card-title">
      <div className="profile-card-heading">
        <img src={profile.avatar} alt={`${profile.name} 的头像`} />
        <div>
          <h2 id="profile-card-title">{profile.name}</h2>
          <strong>{profile.intro.role}</strong>
        </div>
      </div>
      <p className="profile-bio">{profile.bio}</p>
      <div className="profile-socials" aria-label="社交链接">
        {profile.socialLinks.map((link) => {
          const Icon = socialIcons[link.label] ?? ExternalLink;
          const style =
            link.color === undefined || link.label === 'GitHub'
              ? undefined
              : ({ '--profile-social-color': link.color } as CSSProperties);

          return (
            <a
              key={link.url}
              data-platform={link.label}
              href={link.url}
              rel="noopener noreferrer"
              style={style}
              target="_blank"
            >
              <Icon aria-hidden="true" size={18} />
              <span>{link.label}</span>
            </a>
          );
        })}
      </div>
      <section className="profile-skills" aria-labelledby="skills-title">
        <h3 id="skills-title">技术栈</h3>
        <ul className="profile-skill-grid" aria-label="个人能力与技术栈">
          {profile.skills.map((skill) => {
            const Icon = resolveSkillIcon(skill.icon);
            const style =
              skill.color === undefined
                ? undefined
                : ({ '--profile-skill-color': skill.color } as CSSProperties);

            return (
              <li key={skill.name} style={style}>
                <span className="profile-skill-icon" aria-hidden="true">
                  {Icon === undefined ? <Code2 size={19} /> : <Icon size={19} />}
                </span>
                <span className="profile-skill-name">{skill.name}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}
