import type { GitHubRepo } from '@/lib/github';
import { formatDate } from '@/lib/skills';

type Props = {
  repos: GitHubRepo[];
};

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

export default function RepoGrid({ repos }: Props) {
  if (repos.length === 0) {
    return (
      <section className="card-premium rounded-2xl p-8 text-center">
        <p className="text-text-primary">Gösterilecek repo yok.</p>
        <p className="mt-1 text-sm text-text-muted">Bu kullanıcının herkese açık reposu bulunamadı.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-repos-title">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <span className="section-label">Projeler</span>
          <h2 id="featured-repos-title" className="gradient-text mt-2 text-2xl font-bold tracking-tight">Öne çıkan repolar</h2>
        </div>
        <span className="font-mono text-xs text-text-muted">{repos.length} PROJE</span>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <li key={repo.id} className="card-premium group flex min-h-[220px] flex-col rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-2 font-mono font-semibold text-accent transition-colors hover:text-emerald-300"
              >
                <span className="truncate">{repo.name}</span>
                <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </a>
              {repo.language && (
                <span className="tag shrink-0 rounded-full px-2 py-1 text-[10px]">
                  {repo.language}
                </span>
              )}
            </div>

            <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed text-text-secondary">
              {repo.description ?? 'Bu proje için açıklama bulunmuyor.'}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-4 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5" title="Yıldız">
                <StarIcon />
                <span>{repo.stargazers_count.toLocaleString('tr-TR')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5" title="Fork">
                <ForkIcon />
                <span>{repo.forks_count.toLocaleString('tr-TR')}</span>
              </span>
              <span className="ml-auto font-mono">{formatDate(repo.updated_at)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
