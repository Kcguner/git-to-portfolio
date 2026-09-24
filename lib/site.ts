const DEFAULT_SITE_URL = "https://git-to-portfolio.vercel.app";

function normalizeHttpUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (url.username || url.password) return undefined;

    return trimmed.replace(/\/+$/, "") || undefined;
  } catch {
    return undefined;
  }
}

export function getSiteUrl(): string {
  return normalizeHttpUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? DEFAULT_SITE_URL;
}

export function getGitHubRepoUrl(): string | undefined {
  const normalized = normalizeHttpUrl(process.env.NEXT_PUBLIC_GITHUB_REPO_URL);
  if (!normalized) return undefined;

  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:") return undefined;
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      return undefined;
    }
    return normalized;
  } catch {
    return undefined;
  }
}
