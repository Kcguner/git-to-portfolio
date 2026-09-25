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

vi.mock("next/image", () => ({
  default: ({
    alt,
    preload: _preload,
    priority: _priority,
    ...props
  }: {
    alt: string;
    preload?: boolean;
    priority?: boolean;
    [key: string]: unknown;
  }) => {
    void _preload;
    void _priority;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} {...props} />
    );
  },
}));

import UserPage, { generateMetadata } from "../../app/[username]/page";
import {
  GitHubSecondaryRateLimitError,
  GitHubUserNotFoundError,
  GitHubUpstreamError,
} from "../../lib/github";

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

async function render(element: React.ReactElement) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(element);
}

type ActualProfileCardProps = Parameters<
  (typeof import("../../components/ProfileCard"))["default"]
>[0];

/** Renders the *real* ProfileCard (the module-level mock only applies to the page). */
async function renderProfileCard(props: ActualProfileCardProps) {
  const { default: ActualProfileCard } = await vi.importActual<
    typeof import("../../components/ProfileCard")
  >("../../components/ProfileCard");

  return render(ActualProfileCard(props));
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
    expect(githubMocks.getTopRepos).toHaveBeenCalledWith("octocat", 6);
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
    expect(githubMocks.getTopRepos).not.toHaveBeenCalled();
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
    expect(githubMocks.getTopRepos).not.toHaveBeenCalled();
  });

  it("keeps the profile when the repository search hits a rate limit", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    githubMocks.getTopRepos.mockRejectedValue(
      new GitHubSecondaryRateLimitError({ retryAfterMs: 1_000 })
    );

    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = await render(element);

    // The profile card still renders, the languages block is empty and the
    // repository grid falls back to its empty state.
    expect(html).toContain('data-profile="octocat"');
    expect(html).toContain('data-languages=""');
    expect(html).toContain('data-repositories=""');
    expect(navigationMocks.notFound).not.toHaveBeenCalled();

    // The failure stays observable exactly once, with the short code only.
    expect(githubMocks.getTopRepos).toHaveBeenCalledWith("octocat", 6);
    expect(consoleError).toHaveBeenCalledOnce();
    const [message] = consoleError.mock.calls[0] as [string];
    expect(message).toContain("secondary-rate-limit");
    expect(message).not.toContain("Bearer");
    expect(message).not.toContain("X-GitHub-Api-Version");
  });

  it("reports unknown repository failures without leaking details", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    githubMocks.getTopRepos.mockRejectedValue(new Error("socket hang up"));

    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "de" }),
    });
    const html = await render(element);

    expect(html).toContain('data-profile="octocat"');
    expect(html).toContain('data-repositories=""');
    expect(navigationMocks.notFound).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledOnce();
    const [message] = consoleError.mock.calls[0] as [string];
    expect(message).toContain("unknown");
    expect(message).not.toContain("socket hang up");
  });

  it("redirects to the canonical login reported by GitHub", async () => {
    githubMocks.getProfile.mockResolvedValue({ ...profile, login: "mona" });

    await expect(
      UserPage({
        params: Promise.resolve({ username: "octocat" }),
        searchParams: Promise.resolve({ lang: "en" }),
      })
    ).rejects.toThrow("NEXT_REDIRECT:/mona?lang=en");

    expect(navigationMocks.permanentRedirect).toHaveBeenCalledWith("/mona?lang=en");
    expect(githubMocks.getTopRepos).not.toHaveBeenCalled();
  });

  it("rejects an unusable username before any GitHub call", async () => {
    await expect(
      UserPage({
        params: Promise.resolve({ username: "_not-a-login" }),
        searchParams: Promise.resolve({ lang: "en" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(navigationMocks.notFound).toHaveBeenCalledOnce();
    expect(githubMocks.getProfile).not.toHaveBeenCalled();
  });

  it("skips the profile lookup for an unusable username in metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "_not-a-login" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(metadata.title).toBe("User not found");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(githubMocks.getProfile).not.toHaveBeenCalled();
  });

  it("renders the page header at every breakpoint without a second h1", async () => {
    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = await render(element);

    // Section label + login, plus the compact mobile-only @login tag.
    expect(html).toContain("Profile /");
    expect(html).toContain('class="hidden sm:inline"> octocat');
    expect(html).toContain('class="tag shrink-0 rounded-full px-3 py-1.5 sm:hidden"');
    // The title is a paragraph now; the single h1 comes from ProfileCard.
    expect(html).toContain(
      '<p class="mt-2 text-2xl font-bold tracking-tight text-text-primary">GitHub portfolio</p>'
    );
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("hidden sm:block");
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

describe("profile card avatar host handling", () => {
  const topLanguages: ActualProfileCardProps["topLanguages"] = [
    { name: "TypeScript", count: 3, percent: 100 },
  ];

  it("optimizes allowlisted GitHub avatar hosts", async () => {
    const html = await renderProfileCard({
      profile,
      topLanguages,
      locale: "en",
    });

    expect(html).toContain(
      '<img alt="octocat avatar" src="https://avatars.githubusercontent.com/u/1?v=4"'
    );

    const identicon = await renderProfileCard({
      profile: { ...profile, avatar_url: "https://github.com/identicons/octocat.png" },
      topLanguages: [],
      locale: "en",
    });
    expect(identicon).toContain('src="https://github.com/identicons/octocat.png"');
  });

  it("falls back to an initial avatar for unknown hosts", async () => {
    const html = await renderProfileCard({
      profile: { ...profile, avatar_url: "https://cdn.example.com/evil.png" },
      topLanguages,
      locale: "en",
    });

    expect(html).not.toContain("<img");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="octocat avatar"');
    expect(html).toContain("profile-avatar");
    // First character of the display name, upper-cased.
    expect(html).toMatch(/profile-avatar[^>]*>T</);
    // The languages block is unaffected by the avatar failure.
    expect(html).toContain("TypeScript");
  });

  it("falls back for non-https and unparsable avatar URLs", async () => {
    const insecure = await renderProfileCard({
      profile: { ...profile, avatar_url: "http://github.com/identicons/x.png" },
      topLanguages: [],
      locale: "en",
    });
    expect(insecure).not.toContain("<img");
    expect(insecure).toContain('role="img"');

    const broken = await renderProfileCard({
      profile: { ...profile, avatar_url: "not a url" },
      topLanguages: [],
      locale: "en",
    });
    expect(broken).not.toContain("<img");
    expect(broken).toContain('role="img"');
  });

  it("uses the login initial when the profile has no name", async () => {
    const html = await renderProfileCard({
      profile: { ...profile, name: null, avatar_url: "https://evil.test/a.png" },
      topLanguages: [],
      locale: "en",
    });

    expect(html).toMatch(/profile-avatar[^>]*>O</);
  });

  it("exposes the verification badge label to assistive technology", async () => {
    const html = await renderProfileCard({ profile, topLanguages: [], locale: "en" });

    // No more title/aria-hidden contradiction: the label is real, sr-only text.
    expect(html).not.toContain("title=");
    expect(html).toContain('<span class="sr-only">GitHub profile link</span>');
  });

  it("keeps a single h1 as the display name", async () => {
    const html = await renderProfileCard({
      profile,
      topLanguages,
      locale: "en",
    });

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(
      '<h1 class="gradient-text mt-3 break-words text-3xl font-bold tracking-tight sm:text-4xl">The Octocat</h1>'
    );
    // Nested section headings stay in place for screen readers.
    expect(html).toContain(
      '<h2 class="mt-2 text-lg font-semibold tracking-tight text-text-primary">Top 3 languages</h2>'
    );
  });
});
