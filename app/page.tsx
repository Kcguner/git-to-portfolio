import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import SearchForm from '@/components/SearchForm';
import SiteHeader from '@/components/SiteHeader';
import { EXAMPLES } from '@/lib/examples';
import {
  getDictionary,
  getLocale,
  getProfilePathname,
  withLocale,
  type SearchParams,
} from '@/lib/i18n';
import {
  getAlternateOpenGraphLocales,
  getHomeKeywords,
  getHomeOpenGraphImagePath,
  getHowToJsonLd,
  getLocaleAlternatesMetadata,
  getOpenGraphLocale,
  getSocialImageMetadata,
  INDEXABLE_ROBOTS,
  SITE_NAME,
} from '@/lib/seo';
import { getGitHubRepoUrl } from '@/lib/site';

const STEP_ICONS = ['user', 'image', 'document'] as const;

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const locale = getLocale(await searchParams);
  const dictionary = getDictionary(locale);
  const title = dictionary.metadata.homeTitle;
  const description = dictionary.metadata.homeDescription;
  const alternates = getLocaleAlternatesMetadata('/', locale);
  const images = getSocialImageMetadata(
    getHomeOpenGraphImagePath(locale),
    dictionary.metadata.ogImage.alt,
  );

  return {
    // `absolute`, not the bare string: the root layout's `%s | Git-to-Portfolio`
    // template is for child segments, and letting it wrap a title that already
    // carries the brand would render "Git to Portfolio … | Git-to-Portfolio".
    // The home page owns its full title.
    title: { absolute: title },
    description,
    keywords: getHomeKeywords(locale),
    alternates,
    openGraph: {
      type: 'website',
      url: alternates.canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale: getOpenGraphLocale(locale),
      // Every other language the site serves, so a share in one of them gets
      // that language's card rather than the default one.
      alternateLocale: getAlternateOpenGraphLocales(locale),
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
}

function StepIcon({ icon }: { icon: (typeof STEP_ICONS)[number] }) {
  if (icon === 'user') {
    return (
      <svg className="h-5 w-5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
      </svg>
    );
  }

  if (icon === 'image') {
    return (
      <svg className="h-5 w-5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" />
        <path d="M3 16l5-5 4 4 3-3 6 6" />
        <circle cx="8.5" cy="9" r="1.25" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" />
      <polyline points="14 3 14 7 18 7" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
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

/**
 * A cell reference, e.g. `S.01` for the first step of sheet S.
 *
 * "S" is the steps section and the numbering is notation, not a word, so it
 * stays the same in every language.
 */
function formatStepCode(index: number): string {
  return `S.${String(index + 1).padStart(2, '0')}`;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = getLocale(await searchParams);
  const dictionary = getDictionary(locale);
  const githubRepoUrl = getGitHubRepoUrl();
  const stepCount = String(dictionary.home.steps.length).padStart(2, '0');

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader locale={locale} />

      {/* The three steps rendered below, as structured data. */}
      <JsonLd data={getHowToJsonLd(locale)} />

      <main className="relative flex-1">
        {/*
          Hero: the title block of the drawing. The kicker, the name at poster
          size, one line of plain text and the field that starts the work -
          no decoration around it, because the type is the decoration.
        */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 sm:pt-14 md:pt-20">
          <div className="mx-auto w-full min-w-0 max-w-3xl">
            {/* The version stamp, restyled from a pill into a drawn kicker. */}
            <p className="section-label max-w-full text-[10px] tracking-[0.12em] sm:text-[11px] sm:tracking-[0.15em]">
              {dictionary.home.badge}
            </p>

            {/*
              The product name is set on two lines at drawing scale. The split
              is a line break, not two words, so the heading keeps the whole
              name as its accessible name.
            */}
            <h1
              aria-label="Git-to-Portfolio"
              // Poster scale starts one step lower: "PORTFOLIO" at text-5xl
              // overflows a 320px sheet, and uppercase black has no second
              // line to break onto.
              className="gradient-text mt-6 font-sans text-[clamp(2rem,11vw,2.25rem)] font-black uppercase leading-[0.95] tracking-tight sm:text-6xl md:text-8xl"
            >
              <span aria-hidden="true" className="block">Git-to-</span>
              {/*
                The second line is drawn as an outline, the way a title is
                lettered on a drawing. Two guards: where the stroke is not
                supported the word stays solid ink rather than invisible, and
                print drops the stroke because it forces solid text — a 2px
                stroke over a filled glyph would print as a blob.
              */}
              <span
                aria-hidden="true"
                className="block [-webkit-text-stroke:2px_rgb(var(--color-text-primary))] supports-[-webkit-text-stroke:1px_black]:text-transparent print:[-webkit-text-stroke-width:0]"
              >
                Portfolio
              </span>
            </h1>

            {/*
              The poster h1 above is the product's name mark, so the sentence
              that says what the product does is the page's subheading, not
              body copy. It carries the words a search query actually uses —
              the brand plus "GitHub portfolio" in this language — and the
              highlighted span is the brand itself.
            */}
            <h2 className="mt-8 max-w-2xl text-balance text-base font-normal leading-relaxed text-text-secondary md:text-lg">
              {dictionary.home.heroBefore}
              <span className="font-semibold text-text-primary">{dictionary.home.heroHighlight}</span>
              {dictionary.home.heroAfter}
            </h2>

            <div className="mt-10">
              <SearchForm locale={locale} />
            </div>
          </div>
        </section>

        <div className="mx-auto mt-16 w-full max-w-6xl px-6 md:mt-24">
          <div className="divider-gradient" />
        </div>

        {/* Detail A: how the sheet is produced, as three cells. */}
        <section id="nasil-calisir" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-14 md:py-20">
          <div className="card-premium">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 md:px-8">
              <span className="section-label">{dictionary.home.howLabel}</span>
              <span className="tag bg-accent px-2 py-1 text-background">{stepCount}</span>
            </div>

            <div className="px-5 py-8 md:px-8 md:py-10">
              {/* `font-sans` is explicit: globals.css still sets a serif on
                  every heading, and this sheet is drawn in the grotesk. */}
              <h2 className="gradient-text font-sans text-3xl font-black tracking-tight md:text-4xl">
                {dictionary.home.howTitle}
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-text-secondary">
                {dictionary.home.howDescription}
              </p>

              <ol className="mt-8 grid grid-cols-1 border-l border-t border-border min-[900px]:grid-cols-3">
                {dictionary.home.steps.map((step, index) => (
                  <li
                    key={index + 1}
                    className="border-b border-r border-border p-6 md:p-8"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-mono text-[11px] tracking-[0.14em] text-accent">
                        {formatStepCode(index)}
                      </span>
                      <StepIcon icon={STEP_ICONS[index]} />
                    </div>
                    <h3 className="mt-6 font-sans text-lg font-black tracking-tight text-text-primary">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Detail B: finished sheets, as a list of cells. */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-20 md:pb-24">
          <div className="card-premium">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-5 py-4 md:px-8">
              <div>
                <span className="section-label">{dictionary.home.tryLabel}</span>
                <h2 className="gradient-text mt-2 font-sans text-2xl font-black tracking-tight md:text-3xl">
                  {dictionary.home.profilesTitle}
                </h2>
              </div>
              <span className="tag px-2 py-1">{dictionary.home.liveExamples}</span>
            </div>

            <div className="px-5 py-6 md:px-8 md:py-8">
              <p className="text-text-secondary">{dictionary.home.profilesDescription}</p>

              {/* Two cells in a max-w-6xl panel would sit far apart, so the row is
                  capped and centred to keep them at a readable width. */}
              <ul className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {EXAMPLES.map((example) => (
                  <li key={example.username}>
                    <Link
                      prefetch={false}
                      href={withLocale(getProfilePathname(example.username), locale)}
                      className="pill-btn group flex items-center justify-between gap-4 px-4 py-4"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {/* The initials are a stamped square, not a medallion. */}
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center border border-border font-mono text-xs font-bold text-accent"
                        >
                          {example.initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-sm text-text-primary transition-colors group-hover:text-accent">
                            /{example.username}
                          </span>
                          <span className="mt-0.5 block text-xs text-text-muted">
                            {dictionary.home.exampleDescriptions[example.descriptionKey]}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-text-muted transition-colors group-hover:text-accent">
                        <ArrowIcon />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Titleblock strip: the same hairline strip every drawing ends with. */}
      <footer className="mx-auto w-full max-w-6xl px-6 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          <span>{dictionary.home.copyright(new Date().getFullYear())}</span>
          <nav className="flex flex-wrap items-center gap-4">
            {githubRepoUrl && (
              <a href={githubRepoUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-accent">
                GitHub
              </a>
            )}
            <Link
              href={`${withLocale('/', locale)}#nasil-calisir`}
              className="transition-colors hover:text-accent"
            >
              {dictionary.home.howLink}
            </Link>
            {githubRepoUrl && (
              <a href={githubRepoUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-accent">
                {dictionary.home.source}
              </a>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
