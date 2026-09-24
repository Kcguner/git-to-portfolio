import Link from "next/link";
import type { ReactNode } from "react";
import { getGitHubRepoUrl } from "@/lib/site";

type SiteHeaderProps = {
  children?: ReactNode;
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

export function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="Git-to-Portfolio ana sayfa">
      <span className="logo-mark flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105">
        <GitHubIcon className="h-4 w-4 text-white" />
      </span>
      <span className="font-semibold tracking-tight text-text-primary">Git-to-Portfolio</span>
    </Link>
  );
}

export default function SiteHeader({ children }: SiteHeaderProps) {
  const githubRepoUrl = getGitHubRepoUrl();

  return (
    <nav className="no-print sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Brand />
        {children ?? (
          <div className="flex items-center gap-2">
            {githubRepoUrl && (
              <a
                href={githubRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-2 px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary sm:inline-flex"
              >
                <GitHubIcon />
                GitHub
              </a>
            )}
            <Link
              href="/#nasil-calisir"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-border-hover"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="hidden sm:inline">Dokümantasyon</span>
              <span className="sm:hidden">Bilgi</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
