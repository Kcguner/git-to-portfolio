import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import { getProfile, GitHubUserNotFoundError } from '@/lib/github';
import type { GitHubProfile } from '@/lib/github';
import {
  DEFAULT_LOCALE,
  getDictionary,
  getProfileBasePathname,
  getProfilePathname,
  isLocale,
  withBaseLocale,
  type Locale,
} from '@/lib/i18n';
import {
  getAlternateOpenGraphLocales,
  getLocaleAlternatesMetadata,
  getOpenGraphLocale,
  getProfileKeywords,
  getProfileOpenGraphImagePath,
  getSocialImageMetadata,
  INDEXABLE_ROBOTS,
  NO_INDEX_ROBOTS,
  SITE_NAME,
} from '@/lib/seo';
import { normalizeUsername } from '@/lib/username';
import PrintButton from '@/components/PrintButton';
import ProfileCard from '@/components/ProfileCard';
import ProfileRepos from '@/components/ProfileRepos';
import ReposSkeleton from '@/components/ReposSkeleton';
import ShareButton from '@/components/ShareButton';
import SiteHeader from '@/components/SiteHeader';

/**
 * The page is cached for an hour and then regenerated in the background.
 *
 * Nothing below reads a request-time value any more — the locale is a path
 * segment and the username is a path segment — so the rendered page can be
 * stored and served from the cache, and only the page that is actually asked
 * for is ever built.
 */
export const revalidate = 3600;

/**
 * No profile is prerendered at build time.
 *
 * There is no list of GitHub accounts to prerender — the site publishes one
 * page per account that anyone asks for — so this returns an empty array.
 * That is the documented way to tell Next.js that the paths of this route
 * are generated the first time they are visited and then cached (and
 * revalidated on the interval above), instead of being rendered per request.
 */
export async function generateStaticParams(): Promise<Array<{ username: string }>> {
  return [];
}

type PageProps = {
  params: Promise<{ locale: string; username: string }>;
};

type ResolvedRoute = {
  /** The locale segment exactly as it came in, before it was validated. */
  rawLocale: string;
  locale: Locale;
  requested: string;
  normalized: string | null;
};

/**
 * The two path segments of this route.
 *
 * The locale is validated against the four languages the site serves; the
 * username is normalized the way GitHub normalizes it. An unsupported locale
 * is not a page of this site, and an unusable username is not a person.
 *
 * The `locale` in the result is a **validated** fallback, not a silent one:
 * for a segment the site does not serve it is the default locale, which is
 * exactly the language the not-found page is rendered in. A caller that has
 * to *refuse* the segment checks `isLocale(rawLocale)` itself — the metadata
 * and the body below both do.
 */
async function resolveRoute(params: PageProps['params']): Promise<ResolvedRoute> {
  const { locale: rawLocale, username: requested } = await params;
  const normalized = normalizeUsername(requested);

  return {
    rawLocale,
    locale: isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE,
    requested,
    normalized,
  };
}

/**
 * The canonical URL of a profile page and its hreflang cluster.
 *
 * The cluster is built from the **base** path — the bare username path — so
 * the alternates never have to guess whether the first segment is a language
 * or a login: the account called `en` is published under `/tr/en`, `/en/en`,
 * `/de/en` and `/es/en`, not under the four language homes.
 *
 * The canonical is the localized URL of this page, built from the canonical
 * login rather than read back out of a path. Both halves come from the same
 * helper, so they can never describe two different pages.
 */
function getProfileAlternates(
  canonicalUsername: string,
  locale: Locale,
): { canonical: string; languages: Record<string, string> } {
  return getLocaleAlternatesMetadata(getProfileBasePathname(canonicalUsername), locale);
}

/**
 * The page's title, description, canonical URL and social card. It runs on the
 * same profile lookup as the page below, and turns any failure into a
 * localized no-index title rather than a promise of a page that is not there.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { rawLocale, locale, normalized } = await resolveRoute(params);

  // The body below answers an unsupported locale segment and an unusable
  // username with a 404, so the metadata must not describe a page that is not
  // there. The title is the one the not-found page is rendered with, in the
  // language that page answers in.
  if (!isLocale(rawLocale) || !normalized) {
    return {
      title: getDictionary(locale).metadata.userNotFoundTitle,
      robots: NO_INDEX_ROBOTS,
    };
  }

  const username = normalized;
  const dictionary = getDictionary(locale);

  try {
    const profile = await getProfile(username);
    const canonicalUsername = normalizeUsername(profile.login) ?? username;
    const alternates = getProfileAlternates(canonicalUsername, locale);
    const displayName = profile.name?.trim() || profile.login;
    const description = profile.bio?.trim() || dictionary.metadata.portfolioDescription(displayName);
    const title = dictionary.metadata.portfolioTitle(displayName);
    const images = getSocialImageMetadata(
      getProfileOpenGraphImagePath(canonicalUsername, locale),
      dictionary.metadata.profileOgImage.alt(displayName),
    );

    return {
      title,
      description,
      keywords: getProfileKeywords(locale, displayName),
      alternates,
      openGraph: {
        type: 'profile',
        url: alternates.canonical,
        siteName: SITE_NAME,
        locale: getOpenGraphLocale(locale),
        alternateLocale: getAlternateOpenGraphLocales(locale),
        // Only the handle is a real `og:profile` field here: the display name
        // is frequently a full name, which would have to be split to fill
        // first_name/last_name, and guessing a split would be wrong.
        username: canonicalUsername,
        title,
        description,
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images,
      },
      robots: INDEXABLE_ROBOTS,
    };
  } catch {
    return {
      title: dictionary.metadata.userNotFoundTitle,
      description: dictionary.notFound.userDescription,
      robots: NO_INDEX_ROBOTS,
    };
  }
}

export default async function UserPage({ params }: PageProps) {
  // Everything above the Suspense boundary below runs before the response is
  // committed, which is what makes the two outcomes real HTTP status lines: a
  // missing user is a `404` and a non-canonical login is a `308`. Adding a
  // route-level `loading.tsx` or moving a lookup below the boundary would turn
  // both into a streamed `200` with the same UI, so nothing that can suspend is
  // allowed to cross that line.
  //
  // The locale is a path segment now, so there is no `searchParams` to read
  // here any more: reading one would make the route request-time again and
  // there would be nothing left for `revalidate` to cache.
  const { rawLocale, locale, requested, normalized } = await resolveRoute(params);
  if (!isLocale(rawLocale)) notFound();
  if (!normalized) notFound();

  const dictionary = getDictionary(locale);
  const username = normalized;
  if (requested !== username) {
    permanentRedirect(getProfilePathname(username, locale));
  }

  let profile: GitHubProfile;
  try {
    profile = await getProfile(username);
  } catch (error) {
    if (error instanceof GitHubUserNotFoundError) notFound();
    throw error;
  }

  const canonicalUsername = normalizeUsername(profile.login) ?? username;
  if (canonicalUsername !== username) {
    permanentRedirect(getProfilePathname(canonicalUsername, locale));
  }

  const displayName = profile.name?.trim() || profile.login;
  const description = profile.bio?.trim() || dictionary.metadata.portfolioDescription(displayName);
  const shareTitle = dictionary.metadata.portfolioTitle(displayName);
  // The localized, canonical URL of this page: what gets shared, printed and
  // described in structured data.
  const shareUrl = getProfileAlternates(canonicalUsername, locale).canonical;

  return (
    <div className="relative min-h-screen">
      <SiteHeader
        locale={locale}
        actions={(
          <div className="no-print flex shrink-0 items-center gap-2">
            <Link
              href={withBaseLocale('/', locale)}
              className="hidden h-9 shrink-0 items-center gap-2 border border-border bg-surface-elevated px-3 text-[13px] font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary md:inline-flex"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              {dictionary.profile.home}
            </Link>
            <ShareButton
              locale={locale}
              title={shareTitle}
              url={shareUrl}
            />
            <PrintButton locale={locale} />
          </div>
        )}
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Screen-only context strip. On paper it would sit above the person's
            name and compete with it, and everything it says is repeated by the
            profile card below and the footer, so it is not printed. */}
        <div className="no-print mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <span className="section-label">
              {dictionary.profile.profileOf}
              {/* On mobile the login lives in the compact stamp below instead. */}
              <span className="hidden sm:inline"> {profile.login}</span>
            </span>
            {/* A stamped square, not a chip. min-w-0 + truncate: a 39-char
                login must ellipsize instead of pushing the sheet wider. */}
            <span className="tag min-w-0 truncate px-3 py-1.5 sm:hidden">@{profile.login}</span>
          </div>
          {/*
            The page's single <h1> is the display name rendered by ProfileCard.
            This is a plain paragraph so the document keeps exactly one h1, and
            it is set in the same heavy grotesk as every other heading.
          */}
          <p className="mt-2 font-sans text-2xl font-black tracking-tight text-text-primary">{dictionary.profile.portfolioTitle}</p>
        </div>

        <ProfileCard profile={profile} locale={locale} />

        {/* The person, their featured repositories and their languages, in the
            language of this page. The repository half of the sheet is the slow
            one, so it streams in behind its own boundary: the shell above is
            already complete, and the status line was committed before any of
            it ran. */}
        <Suspense fallback={<ReposSkeleton locale={locale} />}>
          <ProfileRepos
            username={canonicalUsername}
            locale={locale}
            profile={profile}
            displayName={displayName}
            description={description}
          />
        </Suspense>

        {/* Titleblock strip: a framed line of annotation under the last detail. */}
        <footer className="mt-12 border border-border px-5 py-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
          {dictionary.profile.footer}
          {/* A printed sheet has no address bar, so the page states its own URL. */}
          <span className="print-only"> · {shareUrl}</span>
        </footer>
      </main>
    </div>
  );
}
