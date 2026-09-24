import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getGitHubRepoUrl, getSiteUrl } from "../../lib/site";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalRepoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_GITHUB_REPO_URL;
});

afterEach(() => {
  restoreEnv("NEXT_PUBLIC_SITE_URL", originalSiteUrl);
  restoreEnv("NEXT_PUBLIC_GITHUB_REPO_URL", originalRepoUrl);
});

describe("getSiteUrl", () => {
  it("uses the demo URL when NEXT_PUBLIC_SITE_URL is not set", () => {
    expect(getSiteUrl()).toBe("https://git-to-portfolio.vercel.app");
  });

  it("trims whitespace and removes trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "  https://example.com/portfolio///  ";

    expect(getSiteUrl()).toBe("https://example.com/portfolio");
  });

  it("canonicalizes the origin while preserving a clean base path", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "HTTPS://EXAMPLE.COM:443/Portfolio/";

    expect(getSiteUrl()).toBe("https://example.com/Portfolio");
  });

  it("allows HTTP only for an explicit local development host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000/portfolio/";

    expect(getSiteUrl()).toBe("http://localhost:3000/portfolio");
  });

  it("falls back when the configured URL is invalid", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";

    expect(getSiteUrl()).toBe("https://git-to-portfolio.vercel.app");
  });

  it.each([
    "https://example.com/portfolio?preview=1",
    "https://example.com/portfolio#preview",
    "https://user:password@example.com/portfolio",
    "https://@example.com/portfolio",
    "https://example.com:/portfolio",
    "https:///portfolio",
    "https://example.com//nested",
    "https://example.com/public/../private",
    "https://example.com/%2e%2e/private",
    "https://-invalid.example/portfolio",
    "https://example.com:0",
    "https://intranet/portfolio",
    "http://example.com/portfolio",
  ])("falls back for an unsafe site URL: %s", (siteUrl) => {
    process.env.NEXT_PUBLIC_SITE_URL = siteUrl;

    expect(getSiteUrl()).toBe("https://git-to-portfolio.vercel.app");
  });
});

describe("getGitHubRepoUrl", () => {
  it("uses the project repository when NEXT_PUBLIC_GITHUB_REPO_URL is not set", () => {
    expect(getGitHubRepoUrl()).toBe("https://github.com/Kcguner/git-to-portfolio");
  });

  it("normalizes the configured repository URL", () => {
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL = " https://github.com/example/project// ";

    expect(getGitHubRepoUrl()).toBe("https://github.com/example/project");
  });

  it("keeps accepting the repository URL's existing www host rule", () => {
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL = "https://www.github.com/example/project/";

    expect(getGitHubRepoUrl()).toBe("https://www.github.com/example/project");
  });

  it("falls back to the project repository for an invalid override", () => {
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL = "https://example.com/project";

    expect(getGitHubRepoUrl()).toBe("https://github.com/Kcguner/git-to-portfolio");
  });

  it.each([
    "http://github.com/example/project",
    "https://github.com.evil.example/example/project",
    "https://user:password@github.com/example/project",
  ])("preserves repository protocol, hostname, and credential checks: %s", (repoUrl) => {
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL = repoUrl;

    expect(getGitHubRepoUrl()).toBe("https://github.com/Kcguner/git-to-portfolio");
  });
});
