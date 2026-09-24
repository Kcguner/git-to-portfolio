import type { Metadata } from 'next';
import Link from 'next/link';
import SearchForm from '@/components/SearchForm';
import SiteHeader from '@/components/SiteHeader';
import { EXAMPLES } from '@/lib/examples';
import {
  getDictionary,
  getLocale,
  getLocaleAlternates,
  OPEN_GRAPH_LOCALES,
  withLocale,
  type SearchParams,
} from '@/lib/i18n';
import { getGitHubRepoUrl, getSiteUrl } from '@/lib/site';

const STEP_ICONS = ['user', 'image', 'document'] as const;

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

function getAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}

function getMetadataAlternates(pathname: string, locale: ReturnType<typeof getLocale>) {
  const relativeAlternates = getLocaleAlternates(pathname);
  const languages = Object.fromEntries(
    Object.entries(relativeAlternates).map(([tag, url]) => [tag, getAbsoluteUrl(url)])
  );

  return {
    canonical: getAbsoluteUrl(withLocale(pathname, locale)),
    languages,
  };
}

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const locale = getLocale(await searchParams);
  const dictionary = getDictionary(locale);
  const title = dictionary.metadata.homeTitle;
  const description = dictionary.metadata.homeDescription;
  const canonicalUrl = getAbsoluteUrl(withLocale('/', locale));
  const alternates = getMetadataAlternates('/', locale);

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: 'Git-to-Portfolio',
      title,
      description,
      locale: OPEN_GRAPH_LOCALES[locale],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

function StepIcon({ icon }: { icon: (typeof STEP_ICONS)[number] }) {
  if (icon === 'user') {
    return (
      <svg className="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  if (icon === 'image') {
    return (
      <svg className="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  return (
    <svg className="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = getLocale(await searchParams);
  const dictionary = getDictionary(locale);
  const githubRepoUrl = getGitHubRepoUrl();

  return (
    <div className="relative min-h-screen">
      <SiteHeader locale={locale} />

      <main className="relative overflow-hidden">
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />

        <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-20 md:pb-32 md:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="tag mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
              <span>{dictionary.home.badge}</span>
            </div>

            <h1 className="gradient-text mb-6 animate-slide-up text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
              Git-to-Portfolio
            </h1>

            <p className="mx-auto mb-12 max-w-2xl animate-slide-up stagger-1 text-lg leading-relaxed text-text-secondary md:text-xl">
              {dictionary.home.heroBefore}
              <span className="font-medium text-text-primary">{dictionary.home.heroHighlight}</span>
              {dictionary.home.heroAfter}
            </p>

            <div className="animate-slide-up stagger-2">
              <SearchForm locale={locale} />
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="divider-gradient" />
        </div>

        <section id="nasil-calisir" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20 md:py-28">
          <div className="mb-16 text-center">
            <span className="section-label">{dictionary.home.howLabel}</span>
            <h2 className="gradient-text mb-4 mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              {dictionary.home.howTitle}
            </h2>
            <p className="mx-auto max-w-xl text-text-secondary">{dictionary.home.howDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {dictionary.home.steps.map((step, index) => (
              <article
                key={index + 1}
                className={`card-premium animate-slide-up rounded-2xl p-8 stagger-${index + 1}${index === 1 ? ' featured-card' : ''}`}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="step-number flex h-12 w-12 items-center justify-center rounded-xl">
                    <span className="font-mono text-lg font-bold text-accent">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <StepIcon icon={STEP_ICONS[index]} />
                </div>
                <h3 className="mb-3 text-xl font-semibold tracking-tight text-text-primary">{step.title}</h3>
                <p className="leading-relaxed text-text-secondary">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20 md:pb-28">
          <div className="card-premium rounded-2xl p-8 md:p-12">
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="section-label">{dictionary.home.tryLabel}</span>
                <h2 className="gradient-text mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                  {dictionary.home.profilesTitle}
                </h2>
                <p className="mt-2 text-text-secondary">{dictionary.home.profilesDescription}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
                <span>{dictionary.home.liveExamples}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {EXAMPLES.map((example) => (
                <Link
                  prefetch={false}
                  key={example.username}
                  href={withLocale(`/${encodeURIComponent(example.username)}`, locale)}
                  className="pill-btn group flex items-center justify-between rounded-xl px-6 py-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-gradient-to-br from-accent/20 to-accent/5 font-mono text-sm font-bold text-accent">
                      {example.initials}
                    </div>
                    <div>
                      <div className="font-mono font-medium text-text-primary transition-colors group-hover:text-accent">
                        /{example.username}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {dictionary.home.exampleDescriptions[example.username]}
                      </div>
                    </div>
                  </div>
                  <span className="text-text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent">
                    <ArrowIcon />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="logo-mark flex h-6 w-6 items-center justify-center rounded-md">
              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </div>
            <span className="text-sm text-text-muted">{dictionary.home.copyright}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            {githubRepoUrl && (
              <a href={githubRepoUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-text-primary">
                GitHub
              </a>
            )}
            <Link href={`${withLocale('/', locale)}#nasil-calisir`} className="transition-colors hover:text-text-primary">
              {dictionary.home.howLink}
            </Link>
            {githubRepoUrl && (
              <a href={githubRepoUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-text-primary">
                {dictionary.home.source}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
