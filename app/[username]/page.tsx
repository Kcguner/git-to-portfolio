import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getProfile,
  getTopRepos,
  GitHubUserNotFoundError,
} from '@/lib/github';
import type { GitHubProfile, GitHubRepo } from '@/lib/github';
import {
  getDictionary,
  getLocale,
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
import SiteHeader from '@/components/SiteHeader';

export const revalidate = 3600;

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

function getCanonicalUrl(pathname: string, locale: ReturnType<typeof getLocale>): string {
  // Canonical URLs should not include tracking/debug query parameters.
  return `${getSiteUrl()}${withLocale(pathname, locale)}`;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [resolvedUsername, query] = await Promise.all([resolveUsername(params), searchParams]);
  const locale = getLocale(query);
  const dictionary = getDictionary(locale);

  if (!resolvedUsername) {
    return {
      title: dictionary.metadata.userNotFoundTitle,
      robots: { index: false, follow: false },
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
    const imageUrl = `/${encodeURIComponent(canonicalUsername)}/opengraph-image`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
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
      title: dictionary.metadata.portfolioTitle(username),
      description: dictionary.metadata.fallbackDescription(username),
      robots: { index: false, follow: false },
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
  let repos: GitHubRepo[];

  try {
    profile = await getProfile(username);
    const canonicalUsername = normalizeUsername(profile.login) ?? username;
    if (canonicalUsername !== username) {
      permanentRedirect(withLocale(`/${encodeURIComponent(canonicalUsername)}`, locale, query));
    }
    repos = await getTopRepos(canonicalUsername, 100);
  } catch (error) {
    if (error instanceof GitHubUserNotFoundError) notFound();
    throw error;
  }

  const topRepos = repos.slice(0, 6);
  const topLanguages = calculateTopLanguages(repos);

  return (
    <div className="relative min-h-screen">
      <SiteHeader locale={locale}>
        <div className="no-print flex items-center gap-2">
          <Link
            href={withLocale('/', locale)}
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary sm:inline-flex"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {dictionary.profile.home}
          </Link>
          <PrintButton locale={locale} />
        </div>
      </SiteHeader>

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <div className="hidden sm:block">
            <span className="section-label">{dictionary.profile.profileOf} {profile.login}</span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{dictionary.profile.portfolioTitle}</h1>
          </div>
          <span className="tag rounded-full px-3 py-1.5 sm:hidden">@{profile.login}</span>
        </div>

        <ProfileCard profile={profile} topLanguages={topLanguages} locale={locale} />

        <div className="mt-10 sm:mt-12">
          <RepoGrid repos={topRepos} locale={locale} />
        </div>

        <footer className="mt-12 border-t border-border/50 pt-6 text-center text-xs text-text-muted">
          {dictionary.profile.footer}
        </footer>
      </main>
    </div>
  );
}
