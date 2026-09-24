export const GITHUB_USERNAME_MAX_LENGTH = 39;

const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

export function validateUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function normalizeUsername(input: string): string | null {
  let value = input.trim();

  if (value.startsWith('@')) {
    value = value.slice(1);
    return validateUsername(value) ? value.toLowerCase() : null;
  }

  if (/^[A-Za-z][A-Za-z\d+.-]*:/i.test(value)) {
    try {
      const url = new URL(value);
      const pathMatch = url.pathname.match(/^\/([^/]+)\/?$/);
      const isGitHubHttpsUrl =
        url.protocol === 'https:' &&
        url.hostname.toLowerCase() === 'github.com' &&
        !url.port &&
        !url.username &&
        !url.password;

      if (!isGitHubHttpsUrl || !pathMatch) return null;

      const username = decodeURIComponent(pathMatch[1]);
      return validateUsername(username) ? username.toLowerCase() : null;
    } catch {
      return null;
    }
  }

  return validateUsername(value) ? value.toLowerCase() : null;
}
