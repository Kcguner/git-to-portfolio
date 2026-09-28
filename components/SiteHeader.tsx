import Link from "next/link";
import type { ReactNode } from "react";
import { getDictionary, withLocale, type Locale } from "@/lib/i18n";
import { getGitHubRepoUrl } from "@/lib/site";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";

type SiteHeaderProps = {
  locale: Locale;
  /**
   * Route-specific actions rendered before the documentation link. The
   * repository and documentation links are always shown: a profile page used
   * to replace them entirely, which left visitors with no way back to the
   * project's source.
   */
  actions?: ReactNode;
};

function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <Link
      href={withLocale("/", locale)}
      className="flex shrink-0 items-center gap-3"
      aria-label={dictionary.header.homeLabel}
    >
      <span className="logo-mark flex h-7 w-7 items-center justify-center">
        <GitHubIcon className="h-4 w-4 text-white" />
      </span>
      {/* The product name must never wrap: at 640-900px the action row needs
          the room. The logo mark alone still identifies the site. */}
      <span className="hidden whitespace-nowrap font-sans text-[15px] font-extrabold tracking-tight text-text-primary sm:inline">
        Git-to-Portfolio
      </span>
    </Link>
  );
}

export default function SiteHeader({ locale, actions }: SiteHeaderProps) {
  const dictionary = getDictionary(locale);
  const githubRepoUrl = getGitHubRepoUrl();

  return (
    /* Solid paper with a single hairline under it. The frosted-glass treatment
       it replaces was a dark-theme device: on paper it only muddied the type. */
    <nav className="no-print sticky top-0 z-50 border-b border-border bg-background">
      {/* One instrument row: every control is h-9, boxed actions share one
          vocabulary, and the site links stay quiet text. */}
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <Brand locale={locale} />
        {/* min-w-0 so the action row can yield space to the brand instead of
            pushing the header wider than the viewport. whitespace-nowrap is not
            cosmetic: every control here is a fixed h-9 box, so a label that
            wraps spills out of its own button and over its neighbours. The
            optional items below give way instead, in the order they matter. */}
        <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          <ThemeToggle locale={locale} />
          <LocaleSwitcher locale={locale} />
          {actions && (
            <span className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" aria-hidden="true" />
          )}
          {actions}
          {/* The two quiet site links are the first things to go: the row needs
              about 860px before the boxed action labels return at `xl`, and the
              brand link already says where home is. */}
          {githubRepoUrl && (
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden h-9 shrink-0 items-center gap-2 px-2 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary xl:inline-flex"
            >
              <GitHubIcon />
              GitHub
            </a>
          )}
          <Link
            href={`${withLocale("/", locale)}#nasil-calisir`}
            className="hidden h-9 shrink-0 items-center gap-2 px-2 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary lg:inline-flex"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>{dictionary.header.documentation}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
