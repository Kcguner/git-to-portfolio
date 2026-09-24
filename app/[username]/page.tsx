import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getProfile,
  getTopRepos,
  GitHubUserNotFoundError,
} from '@/lib/github';
import type { GitHubProfile, GitHubRepo } from '@/lib/github';
import { calculateTopLanguages } from '@/lib/skills';
import { getSiteUrl } from '@/lib/site';
import { normalizeUsername } from '@/lib/username';
import ProfileCard from '@/components/ProfileCard';
import RepoGrid from '@/components/RepoGrid';
import PrintButton from '@/components/PrintButton';
import SiteHeader from '@/components/SiteHeader';

export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ username: string }>;
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

// Empty static params keeps the build independent from GitHub availability while
// enabling on-demand ISR for valid profile routes.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedUsername = await resolveUsername(params);
  if (!resolvedUsername) {
    return {
      title: 'Kullanıcı bulunamadı',
      robots: { index: false, follow: false },
    };
  }

  const username = resolvedUsername.normalized;

  try {
    const profile = await getProfile(username);
    const canonicalUsername = normalizeUsername(profile.login) ?? username;
    const canonicalUrl = `${getSiteUrl()}/${encodeURIComponent(canonicalUsername)}`;
    const displayName = profile.name?.trim() || profile.login;
    const description =
      profile.bio?.trim() ||
      `${displayName} kullanıcısının GitHub portföyü, öne çıkan projeleri ve repo dilleri.`;
    const title = `${displayName} | GitHub portföyü`;
    const imageUrl = `/${encodeURIComponent(canonicalUsername)}/opengraph-image`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: 'profile',
        url: canonicalUrl,
        siteName: 'Git-to-Portfolio',
        locale: 'tr_TR',
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
      title: `${username} | GitHub portföyü`,
      description: `${username} GitHub portföyü — Git-to-Portfolio ile oluşturuldu.`,
      robots: { index: false, follow: false },
    };
  }
}

export default async function UserPage({ params }: PageProps) {
  const resolvedUsername = await resolveUsername(params);
  if (!resolvedUsername) notFound();

  const username = resolvedUsername.normalized;
  if (resolvedUsername.requested !== username) {
    permanentRedirect(`/${encodeURIComponent(username)}`);
  }

  let profile: GitHubProfile;
  let repos: GitHubRepo[];

  try {
    profile = await getProfile(username);
    const canonicalUsername = normalizeUsername(profile.login) ?? username;
    if (canonicalUsername !== username) {
      permanentRedirect(`/${encodeURIComponent(canonicalUsername)}`);
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
      <SiteHeader>
        <div className="no-print flex items-center gap-2">
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary sm:inline-flex"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Ana sayfa
          </Link>
          <PrintButton />
        </div>
      </SiteHeader>

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <div className="hidden sm:block">
            <span className="section-label">Profil / {profile.login}</span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">GitHub portföyü</h1>
          </div>
          <span className="tag rounded-full px-3 py-1.5 sm:hidden">@{profile.login}</span>
        </div>

        <ProfileCard profile={profile} topLanguages={topLanguages} />

        <div className="mt-10 sm:mt-12">
          <RepoGrid repos={topRepos} />
        </div>

        <footer className="mt-12 border-t border-border/50 pt-6 text-center text-xs text-text-muted">
          Git-to-Portfolio ile oluşturuldu · Veriler GitHub API&apos;den alınır
        </footer>
      </main>
    </div>
  );
}
