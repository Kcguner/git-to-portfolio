import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getProfile,
  getTopRepos,
  GitHubError,
  GitHubUserNotFoundError,
} from '@/lib/github';
import type { GitHubProfile, GitHubRepo } from '@/lib/github';
import {
  getDictionary,
  getLocale,
  getLocaleAlternates,
  getProfileOpenGraphImagePath,
  OPEN_GRAPH_LOCALES,
  withLocale,
  type SearchParams,
} from '@/lib/i18n';
import { calculateTopLanguages } from '@/lib/skills';
import { getSiteUrl } from '@/lib/site';
import { normalizeUsername } from '@/lib/username';
import ProfileCard from '@/components/ProfileCard';
import RepoGrid from '@/components/RepoGrid';
import PrintButton from '@/components/PrintButton';
import ShareButton from '@/components/ShareButton';
import SiteHeader from '@/components/SiteHeader';

export const revalidate = 3600;

/** Number of repositories shown on the portfolio, and used for language stats. */
const FEATURED_REPO_COUNT = 6;

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<SearchParams>;
};

type ResolvedUsername = {
  requested: string;
  normalized: string;
};

async function resolveUsername(
  params: PageProps['params']
): Promise<ResolvedUsername | null> {
  const { username: requested } = await params;
  const normalized = normalizeUsername(requested);
  return normalized ? { requested, normalized } : null;
}

/**
 * Returns a short, non-sensitive description of a GitHub failure for logs.
 * The error message may embed request details, so only the failure code and
 * the HTTP status are ever surfaced; neither contains the token or headers.
 */
function describeGitHubFailure(error: unknown): string {
  if (error instanceof GitHubError) {
    return error.status === undefined
      ? error.code
      : `${error.code} (status ${error.status})`;
  }
  return 'unknown';
}

function getCanonicalUrl(pathname: string, locale: ReturnType<typeof getLocale>): string {
  // Canonical URLs should not include tracking/debug query parameters.
  return `${getSiteUrl()}${withLocale(pathname, locale)}`;
}

function getMetadataAlternates(pathname: string, locale: ReturnType<typeof getLocale>) {
  const languages = Object.fromEntries(
    Object.entries(getLocaleAlternates(pathname)).map(([tag, url]) => [
      tag,
      `${getSiteUrl()}${url}`,
    ])
  );

  return {
    canonical: getCanonicalUrl(pathname, locale),
    languages,
  };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [resolvedUsername, query] = await Promise.all([resolveUsername(params), searchParams]);
  const locale = getLocale(query);
  const dictionary = getDictionary(locale);

  if (!resolvedUsername) {
    return {
      title: dictionary.metadata.userNotFoundTitle,
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
    };
  }

  const username = resolvedUsername.normalized;

  try {
    const profile = await getProfile(username);
    const canonicalUsername = normalizeUsername(profile.login) ?? username;
    const canonicalUrl = getCanonicalUrl(`/${encodeURIComponent(canonicalUsername)}`, locale);
    const displayName = profile.name?.trim() || profile.login;
    const description = profile.bio?.trim() || dictionary.metadata.portfolioDescription(displayName);
    const title = dictionary.metadata.portfolioTitle(displayName);
    const imageUrl = getProfileOpenGraphImagePath(canonicalUsername);

    return {
      title,
      description,
      alternates: getMetadataAlternates(`/${encodeURIComponent(canonicalUsername)}`, locale),
      openGraph: {
        type: 'profile',
        url: canonicalUrl,
        siteName: 'Git-to-Portfolio',
        locale: OPEN_GRAPH_LOCALES[locale],
        title,
        description,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch {
    return {
      title: dictionary.metadata.userNotFoundTitle,
      description: dictionary.notFound.userDescription,
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
    };
  }
}

export default async function UserPage({ params, searchParams }: PageProps) {
  const [resolvedUsername, query] = await Promise.all([resolveUsername(params), searchParams]);
  if (!resolvedUsername) notFound();

  const locale = getLocale(query);
  const dictionary = getDictionary(locale);
  const username = resolvedUsername.normalized;
  if (resolvedUsername.requested !== username) {
    permanentRedirect(withLocale(`/${encodeURIComponent(username)}`, locale, query));
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
    permanentRedirect(withLocale(`/${encodeURIComponent(canonicalUsername)}`, locale, query));
  }

  // The repository search endpoint is rate limited far more aggressively than
  // the profile endpoint (10 requests/minute unauthenticated), so a secondary
  // rate limit here must not take the whole page down with it. The profile
  // card, the languages block and the repository empty state still render.
  // Ask for exactly as many repositories as are displayed: the featured
  // language percentages are derived from the same six, so fetching a larger
  // page only burns transfer size and search-API quota. The slice below keeps
  // the page's own contract independent of the data layer's count handling.
  let repos: GitHubRepo[] = [];
  let reposUnavailable = false;
  try {
    repos = await getTopRepos(canonicalUsername, FEATURED_REPO_COUNT);
  } catch (error) {
    reposUnavailable = true;
    // Warn, not error: the page renders successfully with an empty repository
    // state. `console.error` would trip the Next.js dev error overlay and make
    // a working page look broken.
    console.warn(
      `[profile] repository lookup failed (${describeGitHubFailure(error)}); rendering the profile without repositories`
    );
  }

  const topRepos = repos.slice(0, FEATURED_REPO_COUNT);
  const topLanguages = calculateTopLanguages(topRepos);
  const displayName = profile.name?.trim() || profile.login;
  const shareTitle = dictionary.metadata.portfolioTitle(displayName);
  const shareText = profile.bio?.trim() || dictionary.metadata.portfolioDescription(displayName);
  const shareUrl = getCanonicalUrl(`/${encodeURIComponent(profile.login)}`, locale);

  return (
    <div className="relative min-h-screen">
      <SiteHeader
        locale={locale}
        actions={(
          <div className="no-print flex items-center gap-2">
            <Link
              href={withLocale('/', locale)}
              className="hidden items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary md:inline-flex"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              {dictionary.profile.home}
            </Link>
            <ShareButton
              locale={locale}
              title={shareTitle}
              text={shareText}
              url={shareUrl}
            />
            <PrintButton locale={locale} />
          </div>
        )}
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <span className="section-label">
              {dictionary.profile.profileOf}
              {/* On mobile the login lives in the compact tag below instead. */}
              <span className="hidden sm:inline"> {profile.login}</span>
            </span>
            <span className="tag shrink-0 rounded-full px-3 py-1.5 sm:hidden">@{profile.login}</span>
          </div>
          {/*
            The page's single <h1> is the display name rendered by ProfileCard.
            This is a plain paragraph so the document keeps exactly one h1.
          */}
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{dictionary.profile.portfolioTitle}</p>
        </div>

        <ProfileCard profile={profile} topLanguages={topLanguages} locale={locale} />

        <div className="mt-10 sm:mt-12">
          <RepoGrid repos={topRepos} locale={locale} unavailable={reposUnavailable} />
        </div>

        <footer className="mt-12 border-t border-border/50 pt-6 text-center text-xs text-text-muted">
          {dictionary.profile.footer}
        </footer>
      </main>
    </div>
  );
}
