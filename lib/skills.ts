export interface TopLanguage {
  name: string;
  count: number;
  percent: number;
}

function normalizeTopN(topN: number | null | undefined, fallback: number): number {
  if (topN === undefined || topN === null) return fallback;
  if (!Number.isFinite(topN) || topN <= 0) return 0;
  return Math.floor(topN);
}

function compareLanguageNames(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function calculateTopLanguages(
  repos: { language: string | null }[],
  topN?: number | null
): TopLanguage[] {
  const counts = new Map<string, number>();

  for (const repo of repos) {
    const language = repo.language?.trim();
    if (!language) continue;
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  if (total === 0) return [];

  const limit = normalizeTopN(topN, 3);
  if (limit === 0) return [];

  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((left, right) => {
      const countDifference = right.count - left.count;
      return countDifference !== 0
        ? countDifference
        : compareLanguageNames(left.name, right.name);
    })
    .slice(0, limit);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
