import type { GitHubRepo } from '@/lib/github';
import { getDictionary, LOCALE_TAGS, type Locale } from '@/lib/i18n';
import { getLanguageColor } from '@/lib/language-colors';

type Props = {
  repos: GitHubRepo[];
  locale: Locale;
  /**
   * Which list is on the sheet. A pinned list is the user's own ordering, a
   * starred list is our ranking of what they pushed most recently, and the two
   * must not be presented as the same claim.
   */
  source?: RepoSource;
  /**
   * Set when the repository lookup itself failed. The empty state then has to
   * say so: claiming that a user has no public repositories when the request
   * merely timed out is worse than showing nothing.
   */
  unavailable?: boolean;
};

/** `'pinned'` is the user's own choice of repositories; `'starred'` is a ranking. */
export type RepoSource = 'pinned' | 'starred';

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z" />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="5" r="2" />
      <circle cx="12" cy="19" r="2" />
      <path d="M6 7v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M12 12v5" />
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

function formatUpdatedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * The sheet's cell reference, e.g. `B.01` or `B.01 · TypeScript`.
 *
 * "B" is this detail on the drawing (the profile card is detail A), so the
 * numbering is notation, not a word, and stays the same in every language.
 */
function formatCellCode(index: number, language: string | null): string {
  const cell = `B.${String(index + 1).padStart(2, '0')}`;
  return language ? `${cell} · ${language}` : cell;
}

export default function RepoGrid({ repos, locale, source = 'starred', unavailable = false }: Props) {
  const dictionary = getDictionary(locale);
  const localeTag = LOCALE_TAGS[locale];

  if (unavailable && repos.length === 0) {
    return (
      <section className="card-premium p-8 text-center hover:shadow-none">
        <p className="text-text-primary">{dictionary.repositories.unavailableTitle}</p>
        <p className="mt-1 text-sm text-text-muted">{dictionary.repositories.unavailableDescription}</p>
      </section>
    );
  }

  if (repos.length === 0) {
    return (
      <section className="card-premium p-8 text-center hover:shadow-none">
        <p className="text-text-primary">{dictionary.repositories.emptyTitle}</p>
        <p className="mt-1 text-sm text-text-muted">{dictionary.repositories.emptyDescription}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-repos-title">
      <div className="mb-6 flex items-end justify-between gap-4 border-t border-border pt-4">
        <div>
          <span className="section-label">{dictionary.repositories.projectsLabel}</span>
          <h2 id="featured-repos-title" className="gradient-text mt-2 font-sans text-2xl font-black tracking-tight">
            {source === 'pinned'
              ? dictionary.repositories.pinnedTitle
              : dictionary.repositories.title}
          </h2>
        </div>
        <span className="font-mono text-xs tabular-nums text-text-muted">{dictionary.repositories.projectCount(repos.length)}</span>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo, index) => (
          // A project is a cell on the sheet: a code, a name, a note and a row
          // of figures. Nothing lifts, nothing rounds, nothing shouts.
          <li
            key={repo.id}
            // min-w-0: a grid item defaults to min-width auto, so one long
            // unbroken repository name would stretch its whole column and push
            // the sheet off the page. With zero minimums down the chain
            // (li > h3 > a > span.truncate) the name ellipsizes instead.
            className="card-premium group flex min-h-[220px] min-w-0 flex-col p-5 hover:shadow-none"
          >
            {/*
              The sheet's own numbering: which cell this is, and what it is
              drawn in. "B" is this detail; the language colour is a square
              swatch, because a drawing legend is not made of circles.
            */}
            <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-accent">
              {formatCellCode(index, repo.language)}
              {repo.language && (
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2"
                  style={{ backgroundColor: getLanguageColor(repo.language) }}
                />
              )}
            </span>

            <h3 className="mt-3 min-w-0 font-sans text-xl font-black tracking-tight">
              {/*
                `flex`, not `inline-flex`. An inline-level box is sized by its
                content, and a `truncate`d span is nowrap text, so its min-content
                width is the whole name: the row would take the name's full width
                and push the name out past the cell's border. `min-w-0` on the
                child cannot prevent that, because it clamps the child's own
                minimum, not the container's intrinsic one. A block-level flex
                row is instead sized by its containing block, so the span
                shrinks inside it and the name ellipsizes.
              */}
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                title={repo.name}
                className="flex min-w-0 max-w-full items-center gap-2 text-text-primary transition-colors hover:text-accent"
              >
                <span className="min-w-0 truncate">{repo.name}</span>
                <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </a>
            </h3>

            <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed text-text-secondary">
              {repo.description ?? dictionary.repositories.missingDescription}
            </p>

            {/*
              The notes written on a cell: what the project is about, in the
              owner's own words. Framed like the figure row and in the same mono
              face, because on a drawing a tag and a figure are both annotation.
              The data layer already caps the list, and a repository without
              topics gets no row at all rather than an empty one.
            */}
            {repo.topics.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <li
                    key={topic}
                    className="min-w-0 max-w-full truncate border border-border px-1.5 py-0.5 font-mono text-[11px] leading-tight text-text-secondary"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            )}

            {/*
              One hairline row of measures. It is a table of one row and three
              unrelated figures, so it is drawn as bordered cells and labelled by
              the text each one already carries, rather than as a <table> with no
              header cells to give.
            */}
            <div className="mt-auto flex border border-border">
              <span className="inline-flex flex-1 items-center gap-1.5 border-r border-border px-2 py-1 font-mono text-[11px] tabular-nums text-text-muted">
                <span className="sr-only">{dictionary.repositories.stars}: </span>
                <StarIcon />
                {repo.stargazers_count.toLocaleString(localeTag)}
              </span>
              <span className="inline-flex flex-1 items-center gap-1.5 border-r border-border px-2 py-1 font-mono text-[11px] tabular-nums text-text-muted">
                <span className="sr-only">{dictionary.repositories.forks}: </span>
                <ForkIcon />
                {repo.forks_count.toLocaleString(localeTag)}
              </span>
              <span className="flex-1 px-2 py-1 text-right font-mono text-[11px] tabular-nums text-text-muted">
                {formatUpdatedAt(repo.updated_at, locale)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
