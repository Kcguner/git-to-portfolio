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

  it("falls back when the configured URL is invalid", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";

    expect(getSiteUrl()).toBe("https://git-to-portfolio.vercel.app");
  });
});

describe("getGitHubRepoUrl", () => {
  it("returns undefined when NEXT_PUBLIC_GITHUB_REPO_URL is not set", () => {
    expect(getGitHubRepoUrl()).toBeUndefined();
  });

  it("normalizes the configured repository URL", () => {
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL = " https://github.com/example/project// ";

    expect(getGitHubRepoUrl()).toBe("https://github.com/example/project");
  });

  it("rejects repository URLs outside GitHub", () => {
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL = "https://example.com/project";

    expect(getGitHubRepoUrl()).toBeUndefined();
  });
});
