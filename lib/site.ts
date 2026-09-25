const DEFAULT_SITE_URL = "https://git-to-portfolio.vercel.app";
const DEFAULT_GITHUB_REPO_URL = "https://github.com/Kcguner/git-to-portfolio";

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

function isLoopbackHostname(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return (
    value === "localhost" ||
    value.endsWith(".localhost") ||
    value === "[::1]" ||
    /^127(?:\.\d{1,3}){3}$/.test(value)
  );
}

function hasValidSiteHostname(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (!hostname || url.port === "0") return false;
  if (isLoopbackHostname(hostname) || (hostname.startsWith("[") && hostname.endsWith("]"))) {
    return true;
  }
  if (hostname.length > 253 || hostname.endsWith(".")) return false;

  const labels = hostname.split(".");
  return (
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length >= 1 &&
        label.length <= 63 &&
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
    )
  );
}

function hasSafeRawSitePath(value: string): boolean {
  if (/[\\?#\u0000-\u001f\u007f]/.test(value)) return false;

  const schemeSeparator = value.indexOf("://");
  if (schemeSeparator === -1) return false;

  const authorityStart = schemeSeparator + 3;
  const pathStart = value.indexOf("/", authorityStart);
  const authority = value.slice(authorityStart, pathStart === -1 ? value.length : pathStart);
  if (authority.includes("@") || authority.endsWith(":")) return false;
  if (pathStart === -1) return true;

  try {
    return value
      .slice(pathStart + 1)
      .split("/")
      .filter(Boolean)
      .every((segment) => {
        const decoded = decodeURIComponent(segment);
        return decoded !== "." && decoded !== ".." && !decoded.includes("/") && !decoded.includes("\\");
      });
  } catch {
    return false;
  }
}

function normalizeSitePath(pathname: string): string | undefined {
  if (pathname.includes("//") || pathname.includes("\\")) return undefined;

  try {
    const segments = pathname.split("/").filter(Boolean);
    for (const segment of segments) {
      const decoded = decodeURIComponent(segment);
      if (
        decoded === "." ||
        decoded === ".." ||
        decoded.includes("/") ||
        decoded.includes("\\") ||
        /[\u0000-\u001f\u007f]/.test(decoded)
      ) {
        return undefined;
      }
    }
    return segments.length > 0 ? `/${segments.join("/")}` : "";
  } catch {
    return undefined;
  }
}

function normalizeSiteUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !hasSafeRawSitePath(trimmed)) return undefined;

  const normalized = normalizeHttpUrl(trimmed);
  if (!normalized) return undefined;

  try {
    const url = new URL(normalized);
    if (url.search || url.hash) return undefined;
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopbackHostname(url.hostname))) {
      return undefined;
    }
    if (!hasValidSiteHostname(url)) return undefined;

    const path = normalizeSitePath(url.pathname);
    return path === undefined ? undefined : `${url.origin}${path}`;
  } catch {
    return undefined;
  }
}

/**
 * Canonical origin for sharing, metadata, robots.txt and sitemap.xml.
 *
 * Deliberately NOT `NEXT_PUBLIC_`-prefixed: everything that reads it is a
 * Server Component or a metadata route, so the value never has to reach the
 * browser, and an unprefixed name keeps it out of the client bundle. The
 * `NEXT_PUBLIC_` name is still honoured so a deployment that already set it
 * keeps working.
 */
export function getSiteUrl(): string {
  return (
    normalizeSiteUrl(process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL) ??
    DEFAULT_SITE_URL
  );
}

function getValidGitHubRepoUrl(value: string): string | undefined {
  const normalized = normalizeHttpUrl(value);
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

/**
 * Public source repository URL shown in the header and footer.
 *
 * Also server-only, so the `NEXT_PUBLIC_` prefix is unnecessary here for the
 * same reason as in `getSiteUrl()`. The old name stays supported.
 */
export function getGitHubRepoUrl(): string {
  return (
    getValidGitHubRepoUrl(
      process.env.GITHUB_REPO_URL ?? process.env.NEXT_PUBLIC_GITHUB_REPO_URL ?? ""
    ) ?? DEFAULT_GITHUB_REPO_URL
  );
}

/**
 * Normalizes a user-supplied external URL (a GitHub profile's `blog` field) to
 * something safe to put in an `href` or a structured-data `sameAs` list.
 *
 * GitHub stores the blog field exactly as the user typed it, so it may be a
 * bare host (`example.dev`) or carry a non-web scheme (`javascript:alert(1)`).
 * A bare host is upgraded to HTTPS, any other scheme is rejected outright, and
 * anything unparsable becomes `null` so the caller can drop the link instead of
 * rendering a dead or dangerous one.
 */
export function getSafeExternalHttpUrl(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  // A value that already declares a scheme is only accepted when that scheme is
  // http(s); `javascript:`, `data:` and friends are refused below by never
  // being upgraded and by failing the protocol check.
  if (/^[A-Za-z][A-Za-z\d+.-]*:/.test(trimmed) && !/^https?:/i.test(trimmed)) {
    return null;
  }

  try {
    const url = new URL(/^https?:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname ? url.toString() : null;
  } catch {
    return null;
  }
}
