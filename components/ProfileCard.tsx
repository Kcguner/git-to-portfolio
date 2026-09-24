import Image from 'next/image';
import type { ReactNode } from 'react';
import type { GitHubProfile } from '@/lib/github';
import type { TopLanguage } from '@/lib/skills';

type Props = {
  profile: GitHubProfile;
  topLanguages: TopLanguage[];
};

function getSafeBlogUrl(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  if (/^[A-Za-z][A-Za-z\d+.-]*:/.test(trimmedValue) && !/^https?:/i.test(trimmedValue)) {
    return null;
  }

  try {
    const url = new URL(/^https?:/i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function ExternalLinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  const isMail = href.startsWith('mailto:');
  return (
    <a
      href={href}
      {...(!isMail ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="pill-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-primary"
    >
      {children}
      {!isMail && <ExternalLinkIcon />}
    </a>
  );
}

export default function ProfileCard({ profile, topLanguages }: Props) {
  const top3 = topLanguages.slice(0, 3);
  const blog = profile.blog ? getSafeBlogUrl(profile.blog) : null;
  const displayName = profile.name?.trim() || profile.login;

  return (
    <section className="card-premium relative z-10 rounded-2xl p-6 sm:p-8 md:p-10">
      <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
        <div className="relative shrink-0 self-center sm:self-start">
          <Image
            src={profile.avatar_url}
            alt={`${profile.login} avatar`}
            width={160}
            height={160}
            priority
            sizes="(max-width: 640px) 128px, 160px"
            className="profile-avatar h-32 w-32 rounded-full object-cover sm:h-40 sm:w-40"
          />
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-surface bg-accent text-surface" title="GitHub profil bağlantısı" aria-hidden="true">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span className="section-label">Geliştirici profili</span>
          <h1 className="gradient-text mt-3 break-words text-3xl font-bold tracking-tight sm:text-4xl">{displayName}</h1>
          <a href={profile.html_url} target="_blank" rel="noreferrer" className="mt-1 inline-block font-mono text-sm text-accent transition-colors hover:text-emerald-300">
            @{profile.login}
          </a>

          {profile.bio && (
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-text-secondary sm:mx-0 sm:text-base">{profile.bio}</p>
          )}

          {profile.location && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-text-muted sm:justify-start">
              <LocationIcon />
              {profile.location}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
            <div className="stat-pill rounded-xl px-3 py-3 text-center">
              <dt className="text-xs text-text-muted">Takipçi</dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-text-primary">{profile.followers.toLocaleString('tr-TR')}</dd>
            </div>
            <div className="stat-pill rounded-xl px-3 py-3 text-center">
              <dt className="text-xs text-text-muted">Takip</dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-text-primary">{profile.following.toLocaleString('tr-TR')}</dd>
            </div>
            <div className="stat-pill rounded-xl px-3 py-3 text-center">
              <dt className="text-xs text-text-muted">Repo</dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-text-primary">{profile.public_repos.toLocaleString('tr-TR')}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start">
            <LinkButton href={profile.html_url}>GitHub</LinkButton>
            {blog && <LinkButton href={blog}>Blog</LinkButton>}
            {profile.twitter_username && <LinkButton href={`https://x.com/${profile.twitter_username}`}>X</LinkButton>}
            {profile.email && <LinkButton href={`mailto:${profile.email}`}>E-posta</LinkButton>}
          </div>
        </div>
      </div>

      {top3.length > 0 && (
        <div className="mt-8 border-t border-border/70 pt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="section-label">Öne çıkan repo dilleri</span>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-text-primary">En çok görülen 3 dil</h2>
            </div>
            <span className="font-mono text-xs text-text-muted">TOP 3</span>
          </div>
          <ul className="mt-5 space-y-4">
            {top3.map((lang) => (
              <li key={lang.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-text-primary">{lang.name}</span>
                  <span className="font-mono text-text-secondary">%{lang.percent}</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={lang.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${lang.name} yüzde ${lang.percent}`}
                >
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400" style={{ width: `${lang.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
