import Image from 'next/image';
import type { ReactNode } from 'react';
import type { GitHubProfile } from '@/lib/github';
import { getDictionary, LOCALE_TAGS, type Locale } from '@/lib/i18n';
import { getSafeExternalHttpUrl } from '@/lib/site';

type Props = {
  profile: GitHubProfile;
  locale: Locale;
};

/**
 * Hostnames GitHub may return in `avatar_url`: uploaded avatars, identicon /
 * error fallbacks and camo-proxied assets.
 *
 * `next/image` THROWS (and therefore 500s the whole page) when it is handed a
 * remote `src` whose host is not allowlisted by `images.remotePatterns`, so the
 * URL is validated here first and unknown hosts get a CSS-only fallback.
 *
 * Keep in sync with `images.remotePatterns` in `next.config.js`.
 */
const AVATAR_HOSTNAMES = new Set([
  'avatars.githubusercontent.com',
  'github.com',
  'camo.githubusercontent.com',
]);

function isAllowedAvatarUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && AVATAR_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
}

function getAvatarInitial(value: string, localeTag: string): string {
  return value.trim().charAt(0).toLocaleUpperCase(localeTag);
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
      className="pill-btn inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-primary"
    >
      {children}
      {!isMail && <ExternalLinkIcon />}
    </a>
  );
}

/**
 * The person, drawn as a title sheet: the portrait plate, the name, the bio and
 * the figures. The featured languages are not here - they are derived from the
 * repository list, which the page streams in behind its own boundary, so they
 * are rendered by `ProfileRepos` instead.
 */
export default function ProfileCard({ profile, locale }: Props) {
  const dictionary = getDictionary(locale);
  const localeTag = LOCALE_TAGS[locale];
  const blog = getSafeExternalHttpUrl(profile.blog);
  const displayName = profile.name?.trim() || profile.login;
  const avatarAlt = `${profile.login} ${dictionary.profile.avatarAlt}`;
  const hasRemoteAvatar = isAllowedAvatarUrl(profile.avatar_url);

  return (
    <section className="card-premium relative z-10 p-6 hover:shadow-none sm:p-8 md:p-10">
      <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
        {/* A portrait plate, not a medallion: `.profile-avatar` frames it, and the
            square radius is spelled out here so nothing overrides the frame. */}
        <div className="shrink-0 self-center sm:self-start">
          {hasRemoteAvatar ? (
            <Image
              src={profile.avatar_url}
              alt={avatarAlt}
              width={160}
              height={160}
              preload
              sizes="(max-width: 640px) 128px, 160px"
              className="profile-avatar h-32 w-32 rounded-sm object-cover shadow-none sm:h-40 sm:w-40"
            />
          ) : (
            // Pure-CSS fallback: nothing to fetch, so it cannot fail.
            <div
              role="img"
              aria-label={avatarAlt}
              className="profile-avatar flex h-32 w-32 items-center justify-center rounded-sm bg-accent/20 text-4xl font-black uppercase leading-none tracking-tight text-text-primary shadow-none sm:h-40 sm:w-40 sm:text-5xl"
            >
              {getAvatarInitial(displayName, localeTag)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span className="section-label">{dictionary.profile.developerProfile}</span>
          {/* `font-sans` is explicit: globals.css still sets a serif on every
              heading, and this sheet is drawn in the grotesk. */}
          <h1 className="gradient-text mt-3 break-words font-sans text-4xl font-black tracking-tight sm:text-5xl">{displayName}</h1>
          <a href={profile.html_url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-sm font-medium text-accent transition-colors hover:text-accent-hover">
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

          {/* The figures are a spec table: hairline cells, the key on the left,
              the number flush right. Values are not shouted, they are stated. */}
          <dl className="mt-6 border-l border-t border-border">
            <div className="flex items-center justify-between gap-4 border-b border-r border-border px-3 py-2">
              <dt className="font-mono text-[11px] tracking-[0.1em] text-text-muted">{dictionary.profile.followers}</dt>
              <dd className="font-mono text-base font-bold tabular-nums text-text-primary">
                {profile.followers.toLocaleString(localeTag)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-r border-border px-3 py-2">
              <dt className="font-mono text-[11px] tracking-[0.1em] text-text-muted">{dictionary.profile.following}</dt>
              <dd className="font-mono text-base font-bold tabular-nums text-text-primary">
                {profile.following.toLocaleString(localeTag)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-r border-border px-3 py-2">
              <dt className="font-mono text-[11px] tracking-[0.1em] text-text-muted">{dictionary.profile.repositories}</dt>
              <dd className="font-mono text-base font-bold tabular-nums text-text-primary">
                {profile.public_repos.toLocaleString(localeTag)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start">
            <LinkButton href={profile.html_url}>GitHub</LinkButton>
            {blog && <LinkButton href={blog}>{dictionary.profile.blog}</LinkButton>}
            {profile.twitter_username && <LinkButton href={`https://x.com/${profile.twitter_username}`}>X</LinkButton>}
            {profile.email && <LinkButton href={`mailto:${profile.email}`}>{dictionary.profile.email}</LinkButton>}
          </div>
        </div>
      </div>
    </section>
  );
}
