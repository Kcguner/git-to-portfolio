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
  getPinnedRepos: vi.fn(),
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
    getPinnedRepos: githubMocks.getPinnedRepos,
    getTopRepos: githubMocks.getTopRepos,
  };
});

vi.mock("../../components/SiteHeader", () => ({
  // Renders the route actions so the tests can assert what the page passes in.
  default: ({ actions }: { actions?: React.ReactNode }) => <header>{actions}</header>,
}));

vi.mock("../../components/PrintButton", () => ({
  default: () => <button type="button">Print</button>,
}));

vi.mock("../../components/ShareButton", () => ({
  default: ({ url }: { url: string }) => <button type="button">Share {url}</button>,
}));

vi.mock("../../components/ProfileCard", () => ({
  default: ({ profile }: { profile: GitHubProfile }) => (
    <section data-profile={profile.login} />
  ),
}));

// The repository block is the boundary this page streams through, so its two
// leaves are mocked here and asserted through their data attributes: what this
// file is about is which block the page asked for, not how it is drawn.
vi.mock("../../components/FeaturedLanguages", () => ({
  default: ({
    languages,
  }: {
    languages: Array<{ name: string; percent: number }>;
  }) => (
    <ul
      data-languages={languages.map(({ name, percent }) => `${name}:${percent}`).join(",")}
    />
  ),
}));

vi.mock("../../components/RepoGrid", () => ({
  default: ({
    repos,
    source,
    unavailable,
  }: {
    repos: GitHubRepo[];
    source?: string;
    unavailable?: boolean;
  }) => (
    <div
      data-repositories={repos.map(({ name }) => name).join(",")}
      data-source={source ?? ""}
      data-unavailable={String(Boolean(unavailable))}
    />
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
import { dictionaries } from "../../lib/i18n";
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
    topics: [],
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

/**
 * Renders the page with its repository block resolved.
 *
 * The block is behind a Suspense boundary, so the static renderer would only
 * ever produce its fallback. The stream is drained to the end instead, which is
 * what a browser does once the last chunk arrives.
 */
async function render(element: React.ReactElement) {
  const { renderToReadableStream } = await import("react-dom/server");
  const stream = await renderToReadableStream(element);
  await stream.allReady;
  return new Response(stream).text();
}

/**
 * Renders only the shell: whatever the server has committed to before the
 * repository lookup runs. This is the part of the response whose presence keeps
 * the status line meaningful, because a streamed body is already `200 OK`.
 */
async function renderShell(element: React.ReactElement) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(element);
}

/**
 * Parses the JSON-LD data blocks in the rendered markup, in document order. The
 * pages are rendered without the root layout here, so a page contributes one
 * block.
 */
function readJsonLdBlocks(html: string): unknown[] {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
    ([, payload]) => JSON.parse((payload ?? "").replace(/\\u003c/g, "<")),
  );
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
    githubMocks.getPinnedRepos.mockResolvedValue(null);
    githubMocks.getTopRepos.mockResolvedValue(repos);
  });

  afterEach(() => {
    navigationMocks.notFound.mockClear();
    navigationMocks.permanentRedirect.mockClear();
    githubMocks.getProfile.mockReset();
    githubMocks.getPinnedRepos.mockReset();
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
    expect(html).toContain('data-source="starred"');
    expect(html).toContain('data-unavailable="false"');
    expect(html).not.toContain("repo-7");
    expect(githubMocks.getTopRepos).toHaveBeenCalledWith("octocat", 6);
  });

  it("holds the repository block behind a boundary that a status line can survive", async () => {
    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });

    // The page returned its tree without asking GitHub for a single repository.
    // Nothing above the boundary suspends, so an unknown user is still a `404`
    // and a non-canonical login is still a `308` rather than a streamed `200`.
    expect(githubMocks.getPinnedRepos).not.toHaveBeenCalled();
    expect(githubMocks.getTopRepos).not.toHaveBeenCalled();

    const shell = await renderShell(element);

    // What the shell does contain: the person, and a skeleton in the space the
    // repository block will take.
    expect(shell).toContain('data-profile="octocat"');
    expect(shell).toContain('role="status"');
    expect(shell).toContain('aria-busy="true"');
    expect(shell).toContain(dictionaries.en.profile.profileLoading);
    expect(shell).not.toContain("data-repositories");
    expect(shell).not.toContain("data-languages");
  });

  it("shows the repositories the user pinned instead of ranking their own work", async () => {
    const pinned = [repo(101, "TypeScript"), repo(102, "TypeScript"), repo(103, "JavaScript")];
    githubMocks.getPinnedRepos.mockResolvedValue(pinned);

    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = await render(element);

    expect(html).toContain('data-repositories="repo-101,repo-102,repo-103"');
    expect(html).toContain('data-source="pinned"');
    // The featured languages follow whichever list is on the sheet.
    expect(html).toContain('data-languages="TypeScript:67,JavaScript:33"');
    // The ranking is the fallback: it is not paid for when the pinned list
    // answers, and the canonical login is what gets looked up.
    expect(githubMocks.getPinnedRepos).toHaveBeenCalledWith("octocat");
    expect(githubMocks.getTopRepos).not.toHaveBeenCalled();
  });

  it("falls back to the ranked repositories when nothing is pinned", async () => {
    githubMocks.getPinnedRepos.mockResolvedValue([]);

    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "tr" }),
    });
    const html = await render(element);

    expect(html).toContain('data-repositories="repo-1,repo-2,repo-3,repo-4,repo-5,repo-6"');
    expect(html).toContain('data-source="starred"');
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
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    githubMocks.getTopRepos.mockRejectedValue(
      new GitHubSecondaryRateLimitError({ status: 429, retryAfterMs: 1_000 })
    );

    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = await render(element);

    // The profile card still renders, the languages block is left out and the
    // repository grid falls back to its empty state.
    expect(html).toContain('data-profile="octocat"');
    expect(html).not.toContain("data-languages");
    expect(html).toContain('data-repositories=""');
    // The empty state must be marked unavailable, otherwise the page claims
    // the user has no public repositories when GitHub was simply unreachable.
    expect(html).toContain('data-unavailable="true"');
    expect(navigationMocks.notFound).not.toHaveBeenCalled();

    // The failure stays observable exactly once, with the short code only.
    expect(githubMocks.getTopRepos).toHaveBeenCalledWith("octocat", 6);
    expect(consoleWarn).toHaveBeenCalledOnce();
    const [message] = consoleWarn.mock.calls[0] as [string];
    expect(message).toContain("secondary-rate-limit");
    expect(message).toContain("status 429");
    expect(message).not.toContain("Bearer");
    expect(message).not.toContain("X-GitHub-Api-Version");
    // A handled degradation must not trip the Next.js dev error overlay.
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("reports unknown repository failures without leaking details", async () => {
    const consoleWarn = vi
      .spyOn(console, "warn")
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
    expect(consoleWarn).toHaveBeenCalledOnce();
    const [message] = consoleWarn.mock.calls[0] as [string];
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
    // No repository lookup before the profile is confirmed and canonical.
    expect(githubMocks.getPinnedRepos).not.toHaveBeenCalled();
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
    expect(githubMocks.getPinnedRepos).not.toHaveBeenCalled();
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

    // Section label + login, plus the compact mobile-only @login stamp. The
    // streamed markup separates adjacent text nodes with a comment marker, so
    // the login is matched across it rather than glued to the closing bracket.
    expect(html).toContain("Profile /");
    expect(html).toMatch(/class="hidden sm:inline">\s*(?:<!-- -->\s*)?octocat/);
    // A stamped square, not a pill: the single CSS radius governs the sheet,
    // and a 39-char login ellipsizes instead of pushing the sheet wider.
    expect(html).toContain('class="tag min-w-0 truncate px-3 py-1.5 sm:hidden"');
    expect(html).not.toContain("rounded-full");
    // The title is a paragraph now; the single h1 comes from ProfileCard.
    expect(html).toContain(
      '<p class="mt-2 font-sans text-2xl font-black tracking-tight text-text-primary">GitHub portfolio</p>'
    );
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("hidden sm:block");
  });

  it("closes the sheet with a titleblock footer instead of a bare rule", async () => {
    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = await render(element);

    // A drawn strip: framed, in the mono annotation face, not a centred line
    // floating under a fading rule.
    const footer = html.slice(html.indexOf("<footer"));
    expect(footer).toContain("border border-border");
    expect(footer).toContain("font-mono");
    expect(footer).not.toContain("border-t border-border/50");
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
    expect(metadata.keywords).toEqual(
      dictionaries.en.metadata.portfolioKeywords("The Octocat"),
    );
    expect(metadata.openGraph).toMatchObject({
      locale: "en_US",
      alternateLocale: ["tr_TR", "de_DE", "es_ES"],
      username: "octocat",
    });
    // The card is addressed per language, so a crawler that drops the page
    // query still gets this page's language rendered in the image.
    expect(metadata.twitter?.images).toEqual([
      {
        url: "https://git-to-portfolio.vercel.app/octocat/opengraph-image/en",
        alt: "GitHub portfolio of The Octocat",
        type: "image/png",
        width: 1200,
        height: 630,
      },
    ]);
    expect(metadata.openGraph?.images).toEqual(metadata.twitter?.images);
  });

  it("describes the person, their projects and their languages as structured data", async () => {
    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "de" }),
    });
    const html = await render(element);
    const payload = readJsonLdBlocks(html)[0] as {
      '@type': string;
      url: string;
      inLanguage: string;
      mainEntity: {
        '@type': string;
        name: string;
        alternateName: string;
        url: string;
        sameAs: string[];
        knowsAbout: string[];
      };
      hasPart: Array<{
        '@type': string;
        name: string;
        url: string;
        programmingLanguage: string;
        author: { '@id': string };
      }>;
    };

    expect(payload['@type']).toBe("ProfilePage");
    // The localized page, but the entity id stays locale-free so the four
    // languages describe one person rather than four.
    expect(payload.url).toBe("https://git-to-portfolio.vercel.app/octocat?lang=de");
    expect(payload.inLanguage).toBe("de-DE");
    // No `dateCreated`: the account's `created_at` would date the portfolio to
    // the day the GitHub account was opened, which says nothing about the page.
    expect(payload).not.toHaveProperty("dateCreated");
    expect(payload.mainEntity).toMatchObject({
      '@type': "Person",
      name: "The Octocat",
      alternateName: "@octocat",
      url: "https://github.com/octocat",
      // The featured languages of the six displayed repositories.
      knowsAbout: ["JavaScript", "TypeScript"],
    });
    expect(payload.mainEntity.sameAs).toEqual(["https://github.com/octocat"]);

    // Only the six repositories the page displays, in the same order, each one
    // attributed to the person the page is about.
    expect(payload.hasPart.map(({ name }) => name)).toEqual([
      "repo-1",
      "repo-2",
      "repo-3",
      "repo-4",
      "repo-5",
      "repo-6",
    ]);
    expect(payload.hasPart[0]).toMatchObject({
      '@type': "SoftwareSourceCode",
      url: "https://github.com/octocat/repo-1",
      programmingLanguage: "TypeScript",
    });
    expect(payload.hasPart[0]?.author['@id']).toBe(
      "https://git-to-portfolio.vercel.app/octocat#person",
    );
  });

  it("omits the project list from structured data when there are no repositories", async () => {
    githubMocks.getTopRepos.mockResolvedValue([]);

    const element = await UserPage({
      params: Promise.resolve({ username: "octocat" }),
      searchParams: Promise.resolve({ lang: "es" }),
    });
    const payload = readJsonLdBlocks(await render(element))[0] as {
      hasPart?: unknown;
      mainEntity: { knowsAbout: string[] };
    };

    // An empty project list is left out rather than emitted as an empty array,
    // and the language list follows the repositories that are shown.
    expect(payload.hasPart).toBeUndefined();
    expect(payload.mainEntity.knowsAbout).toEqual([]);
  });
});

describe("profile card avatar host handling", () => {
  it("optimizes allowlisted GitHub avatar hosts", async () => {
    const html = await renderProfileCard({
      profile,
      locale: "en",
    });

    expect(html).toContain(
      '<img alt="octocat avatar" src="https://avatars.githubusercontent.com/u/1?v=4"'
    );

    const identicon = await renderProfileCard({
      profile: { ...profile, avatar_url: "https://github.com/identicons/octocat.png" },
      locale: "en",
    });
    expect(identicon).toContain('src="https://github.com/identicons/octocat.png"');
  });

  it("falls back to an initial avatar for unknown hosts", async () => {
    const html = await renderProfileCard({
      profile: { ...profile, avatar_url: "https://cdn.example.com/evil.png" },
      locale: "en",
    });

    expect(html).not.toContain("<img");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="octocat avatar"');
    expect(html).toContain("profile-avatar");
    // First character of the display name, upper-cased.
    expect(html).toMatch(/profile-avatar[^>]*>T</);
    // The rest of the card is unaffected by the avatar failure.
    expect(html).toContain("GitHub mascot");
    expect(html).toContain("border-l border-t border-border");
  });

  it("falls back for non-https and unparsable avatar URLs", async () => {
    const insecure = await renderProfileCard({
      profile: { ...profile, avatar_url: "http://github.com/identicons/x.png" },
      locale: "en",
    });
    expect(insecure).not.toContain("<img");
    expect(insecure).toContain('role="img"');

    const broken = await renderProfileCard({
      profile: { ...profile, avatar_url: "not a url" },
      locale: "en",
    });
    expect(broken).not.toContain("<img");
    expect(broken).toContain('role="img"');
  });

  it("uses the login initial when the profile has no name", async () => {
    const html = await renderProfileCard({
      profile: { ...profile, name: null, avatar_url: "https://evil.test/a.png" },
      locale: "en",
    });

    expect(html).toMatch(/profile-avatar[^>]*>O</);
  });

  it("does not claim the profile is verified", async () => {
    const html = await renderProfileCard({ profile, locale: "en" });

    // GitHub's API says nothing about verification, so the card used to assert
    // something it could not know. The badge, its label and its decorative
    // frame are all gone.
    expect(html).not.toContain("GitHub profile link");
    expect(html).not.toContain("sr-only");
    expect(html).not.toContain('class="absolute -bottom-1 -right-1');
  });

  it("keeps a single h1 as the display name", async () => {
    const html = await renderProfileCard({ profile, locale: "en" });

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(
      '<h1 class="gradient-text mt-3 break-words font-sans text-4xl font-black tracking-tight sm:text-5xl">The Octocat</h1>'
    );
    // The card is one detail of the sheet: the languages and the projects are
    // drawn outside it, so they bring their own headings with them.
    expect(html).not.toContain("<h2");
  });
});
