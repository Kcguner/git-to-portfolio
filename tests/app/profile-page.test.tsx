import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GitHubProfile, GitHubRepo } from "../../lib/github";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const githubMocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getTopRepos: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound,
  permanentRedirect: navigationMocks.permanentRedirect,
}));

vi.mock("../../lib/github", async () => {
  const actual = await vi.importActual<typeof import("../../lib/github")>(
    "../../lib/github"
  );

  return {
    ...actual,
    getProfile: githubMocks.getProfile,
    getTopRepos: githubMocks.getTopRepos,
  };
});

vi.mock("../../components/SiteHeader", () => ({
  default: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
}));

vi.mock("../../components/PrintButton", () => ({
  default: () => <button type="button">Print</button>,
}));

vi.mock("../../components/ShareButton", () => ({
  default: ({ url }: { url: string }) => <button type="button">Share {url}</button>,
}));

vi.mock("../../components/ProfileCard", () => ({
  default: ({
    profile,
    topLanguages,
  }: {
    profile: GitHubProfile;
    topLanguages: Array<{ name: string; percent: number }>;
  }) => (
    <section
      data-profile={profile.login}
      data-languages={topLanguages.map(({ name, percent }) => `${name}:${percent}`).join(",")}
    />
  ),
}));

vi.mock("../../components/RepoGrid", () => ({
  default: ({ repos }: { repos: GitHubRepo[] }) => (
    <div data-repositories={repos.map(({ name }) => name).join(",")} />
  ),
}));

import UserPage, { generateMetadata } from "../../app/[username]/page";
import { GitHubUserNotFoundError, GitHubUpstreamError } from "../../lib/github";

const profile: GitHubProfile = {
  login: "octocat",
  name: "The Octocat",
  avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
  bio: "GitHub mascot",
  followers: 100,
  following: 10,
  public_repos: 7,
  html_url: "https://github.com/octocat",
  blog: null,
  twitter_username: null,
  email: null,
  location: null,
  created_at: "2011-01-25T18:44:36Z",
};

function repo(id: number, language: string | null): GitHubRepo {
  return {
    id,
    name: `repo-${id}`,
    full_name: `octocat/repo-${id}`,
    html_url: `https://github.com/octocat/repo-${id}`,
    description: null,
    stargazers_count: id,
    forks_count: 0,
    language,
    updated_at: "2026-01-02T03:04:05Z",
    fork: false,
    archived: false,
  };
}

const repos = [
  repo(1, "TypeScript"),
  repo(2, "JavaScript"),
  repo(3, "JavaScript"),
  repo(4, "JavaScript"),
  repo(5, "JavaScript"),
  repo(6, "JavaScript"),
  repo(7, "Python"),
];

async function render(element: Awaited<ReturnType<typeof UserPage>>) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(element);
}

describe("profile page", () => {
  beforeEach(() => {
    githubMocks.getProfile.mockResolvedValue(profile);
    githubMocks.getTopRepos.mockResolvedValue(repos);
  });

  afterEach(() => {
    navigationMocks.notFound.mockClear();
    navigationMocks.permanentRedirect.mockClear();
    githubMocks.getProfile.mockReset();
    githubMocks.getTopRepos.mockReset();
  });

  it("uses only the six displayed repositories for language percentages", async () => {
    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = await render(element);

    expect(html).toContain('data-profile="octocat"');
    expect(html).toContain('data-languages="JavaScript:83,TypeScript:17"');
    expect(html).toContain('data-repositories="repo-1,repo-2,repo-3,repo-4,repo-5,repo-6"');
    expect(html).not.toContain("repo-7");
    expect(githubMocks.getTopRepos).toHaveBeenCalledWith("octocat", 100);
  });

  it("redirects non-canonical usernames while preserving the locale", async () => {
    await expect(
      UserPage({
        params: Promise.resolve({ username: "Octocat" }),
        searchParams: Promise.resolve({ lang: "de" }),
      })
    ).rejects.toThrow("NEXT_REDIRECT:/octocat?lang=de");

    expect(navigationMocks.permanentRedirect).toHaveBeenCalledWith("/octocat?lang=de");
    expect(githubMocks.getProfile).not.toHaveBeenCalled();
  });

  it("turns a missing GitHub user into a not-found result", async () => {
    githubMocks.getProfile.mockRejectedValue(new GitHubUserNotFoundError());

    await expect(
      UserPage({
        params: Promise.resolve({ username: "missing-user" }),
        searchParams: Promise.resolve({ lang: "es" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(navigationMocks.notFound).toHaveBeenCalledOnce();
  });

  it("does not hide upstream failures as missing users", async () => {
    githubMocks.getProfile.mockRejectedValue(new GitHubUpstreamError());

    await expect(
      UserPage({
        params: Promise.resolve({ username: "octocat" }),
        searchParams: Promise.resolve({ lang: "tr" }),
      })
    ).rejects.toBeInstanceOf(GitHubUpstreamError);

    expect(navigationMocks.notFound).not.toHaveBeenCalled();
  });

  it("uses localized no-index metadata for a missing profile", async () => {
    githubMocks.getProfile.mockRejectedValue(new GitHubUserNotFoundError());

    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "missing-user" }),
      searchParams: Promise.resolve({ lang: "de" }),
    });

    expect(metadata.title).toBe("Benutzer nicht gefunden");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("builds localized canonical and hreflang metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "https://git-to-portfolio.vercel.app/octocat?lang=en",
      languages: {
        "tr-TR": "https://git-to-portfolio.vercel.app/octocat",
        "en-US": "https://git-to-portfolio.vercel.app/octocat?lang=en",
        "de-DE": "https://git-to-portfolio.vercel.app/octocat?lang=de",
        "es-ES": "https://git-to-portfolio.vercel.app/octocat?lang=es",
      },
    });
    expect(metadata.openGraph).toMatchObject({ locale: "en_US" });
    expect(metadata.twitter?.images).toEqual(["/octocat/opengraph-image"]);
  });
});
