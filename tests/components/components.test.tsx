import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppError from "../../app/error";
import FeaturedLanguages from "../../components/FeaturedLanguages";
import LocaleSwitcher from "../../components/LocaleSwitcher";
import PrintButton from "../../components/PrintButton";
import ProfileCard from "../../components/ProfileCard";
import ProfileRepos from "../../components/ProfileRepos";
import RepoGrid from "../../components/RepoGrid";
import ReposSkeleton from "../../components/ReposSkeleton";
import SearchForm from "../../components/SearchForm";
import SiteHeader from "../../components/SiteHeader";
import type { GitHubProfile, GitHubRepo } from "../../lib/github";
import { GitHubSecondaryRateLimitError } from "../../lib/github";
import { getDictionary, LOCALES } from "../../lib/i18n";

const githubMocks = vi.hoisted(() => ({
  getPinnedRepos: vi.fn(),
  getTopRepos: vi.fn(),
}));

vi.mock("../../lib/github", async () => {
  const actual = await vi.importActual<typeof import("../../lib/github")>(
    "../../lib/github"
  );

  // Only the two lookups the repository block makes are replaced: the failure
  // helpers it degrades with have to stay the real ones.
  return {
    ...actual,
    getPinnedRepos: githubMocks.getPinnedRepos,
    getTopRepos: githubMocks.getTopRepos,
  };
});

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: vi.fn(() => new URLSearchParams("lang=en")),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/current",
  useRouter: () => ({ push: navigationMocks.push }),
  useSearchParams: navigationMocks.searchParams,
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

const profile: GitHubProfile = {
  login: "octocat",
  name: "  The Octocat  ",
  avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
  bio: "GitHub mascot",
  followers: 12345,
  following: 42,
  public_repos: 8,
  html_url: "https://github.com/octocat",
  blog: " github.blog ",
  twitter_username: "github",
  email: "octocat@github.test",
  location: "San Francisco",
  created_at: "2011-01-25T18:44:36Z",
};

const repo: GitHubRepo = {
  id: 7,
  name: "hello-world",
  full_name: "octocat/hello-world",
  html_url: "https://github.com/octocat/hello-world",
  description: null,
  stargazers_count: 1200,
  forks_count: 34,
  language: "TypeScript",
  updated_at: "2026-01-02T03:04:05Z",
  fork: false,
  archived: false,
  topics: [],
};

describe("client components", () => {
  beforeEach(() => {
    navigationMocks.push.mockReset();
    navigationMocks.searchParams.mockReset().mockReturnValue(new URLSearchParams("lang=en"));
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("prints from the localized print button", () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    render(<PrintButton locale="de" />);

    const button = screen.getByRole("button", { name: "Drucken / Als PDF speichern" });
    fireEvent.click(button);

    expect(print).toHaveBeenCalledOnce();
  });

  it("changes locale while preserving path, query and hash", () => {
    window.history.replaceState({}, "", "/current?tab=repos#skills");
    render(<LocaleSwitcher locale="en" />);

    fireEvent.change(screen.getByRole("combobox", { name: "Select language" }), {
      target: { value: "de" },
    });

    expect(navigationMocks.push).toHaveBeenCalledWith("/current?tab=repos&lang=de#skills", {
      scroll: false,
    });
  });

  it("does not navigate for the current or an unsupported locale", () => {
    render(<LocaleSwitcher locale="en" />);
    const select = screen.getByRole("combobox", { name: "Select language" });

    fireEvent.change(select, { target: { value: "en" } });
    fireEvent.change(select, { target: { value: "fr" } });

    expect(navigationMocks.push).not.toHaveBeenCalled();
  });

  it("shows distinct validation messages and normalizes a submitted username", () => {
    render(<SearchForm locale="en" />);
    const input = screen.getByRole("textbox", { name: "GitHub username" });
    const form = screen.getByRole("form", { name: "Create a GitHub portfolio" });

    fireEvent.submit(form);
    expect(screen.getByRole("alert")).toHaveTextContent("GitHub username is required.");

    fireEvent.change(input, { target: { value: "not valid!" } });
    fireEvent.submit(form);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid GitHub username");

    fireEvent.change(input, { target: { value: " @Torvalds " } });
    fireEvent.submit(form);

    expect(navigationMocks.push).toHaveBeenCalledWith("/torvalds?lang=en");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("describes the input with the examples and swaps in the error message", () => {
    render(<SearchForm locale="en" />);
    const input = screen.getByRole("textbox", { name: "GitHub username" });
    const form = screen.getByRole("form", { name: "Create a GitHub portfolio" });

    // The examples block is supplementary help for the input, so it is always
    // part of the description; the error takes precedence when present.
    expect(input).toHaveAttribute("aria-describedby", "github-examples");

    fireEvent.submit(form);

    expect(input).toHaveAttribute(
      "aria-describedby",
      "github-username-error github-examples"
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("retains the error until the username is edited", () => {
    render(<SearchForm locale="en" />);
    const input = screen.getByRole("textbox", { name: "GitHub username" });

    fireEvent.submit(screen.getByRole("form", { name: "Create a GitHub portfolio" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "o" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("wires the application error retry action", () => {
    const retry = vi.fn();
    render(<AppError error={new Error("private details")} retry={retry} />);

    expect(screen.queryByText("private details")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("labels the search field with the host it is asking for", () => {
    render(<SearchForm locale="en" />);

    // The prefix is decoration: the input's own label and description are what
    // a screen reader announces, so the span must stay aria-hidden.
    const prefix = screen.getByText("github.com/");
    expect(prefix).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("textbox", { name: "GitHub username" })).toBeInTheDocument();
  });
});

describe("server-compatible presentation components", () => {
  afterEach(cleanup);

  it("keeps the repository and documentation links alongside route actions", () => {
    // SiteHeader used to treat its children as a replacement for the default
    // links, so every profile page lost the link back to the project's source.
    render(
      <SiteHeader
        locale="en"
        actions={<button type="button">Share</button>}
      />
    );

    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/Kcguner/git-to-portfolio"
    );
    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute(
      "href",
      "/?lang=en#nasil-calisir"
    );
    expect(screen.getByRole("link", { name: "Git-to-Portfolio home" })).toBeInTheDocument();
  });

  it("renders the default header without any route actions", () => {
    render(<SiteHeader locale="tr" />);

    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dokümantasyon" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Dil seçin" })).toBeInTheDocument();
  });

  it("offers the theme toggle next to the language control", () => {
    // The theme is chrome-level, so it lives in the header next to the locale
    // picker and is hidden from paper.
    render(<SiteHeader locale="en" />);

    expect(screen.getByText("Switch to night theme")).toBeInTheDocument();
    expect(screen.getByText("Switch to paper theme")).toBeInTheDocument();
    expect(document.querySelector(".no-print")).not.toBeNull();
  });

  it("renders a safe profile and its external links", () => {
    render(<ProfileCard locale="en" profile={{ ...profile, name: "   " }} />);

    expect(screen.getByRole("heading", { name: "octocat" })).toBeInTheDocument();
    expect(screen.getByAltText("octocat avatar")).toHaveAttribute(
      "src",
      profile.avatar_url
    );
    expect(screen.getByRole("link", { name: /Blog/ })).toHaveAttribute(
      "href",
      "https://github.blog/"
    );
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute(
      "href",
      "mailto:octocat@github.test"
    );
  });

  it("frames the avatar as a portrait plate and claims nothing about it", () => {
    render(<ProfileCard locale="en" profile={profile} />);

    // `.profile-avatar` no longer implies a circle, and this sheet is set square:
    // the radius is explicit, the hairline frame stays, the soft shadow goes.
    const avatar = screen.getByAltText("octocat avatar");
    expect(avatar.className).toContain("rounded-sm");
    expect(avatar.className).not.toContain("rounded-full");
    expect(avatar.className).toContain("shadow-none");

    // The verification badge claimed something the API never verified.
    expect(document.querySelector(".profile-avatar + span")).toBeNull();
    expect(screen.queryByText("GitHub profile link")).not.toBeInTheDocument();
  });

  it("sets every heading in the heavy grotesk and rounds nothing", () => {
    render(<ProfileCard locale="en" profile={profile} />);

    // The paper serif is a global decision; this sheet overrides it on purpose.
    for (const heading of screen.getAllByRole("heading")) {
      expect(heading.className).toContain("font-sans");
      expect(heading.className).toContain("font-black");
      expect(heading.className).toContain("tracking-tight");
    }

    const card = screen.getByRole("heading", { name: "The Octocat" }).closest("section");
    // The card's corners come from `.card-premium` and nothing overrides them.
    expect(card?.className).not.toMatch(/rounded/);
    expect(card?.querySelectorAll(".rounded-full")).toHaveLength(0);
    expect(card).toHaveClass("hover:shadow-none");
  });

  it("states the figures in a hairline spec table", () => {
    render(<ProfileCard locale="en" profile={profile} />);

    const table = screen.getByText("Followers").closest("dl");
    expect(table).not.toBeNull();
    // Cells are drawn with an outer rule and a right/bottom rule per row, which
    // is the table grid without a <table> in the markup.
    expect(table).toHaveClass("border-l", "border-t");

    const value = screen.getByText("12,345");
    expect(value).toHaveClass("font-mono", "font-bold", "tabular-nums");
    // The key is set in small mono, the number flush right of it.
    const key = screen.getByText("Followers");
    expect(key).toHaveClass("font-mono", "text-text-muted");
    const row = value.parentElement;
    expect(row).toHaveClass("justify-between", "border-b", "border-r");
    expect(row).toContainElement(key);

    // The number keeps the locale's thousands separator.
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(document.querySelector(".stat-pill")).toBeNull();
  });

  it("omits unsafe blog schemes and displays a login fallback name", () => {
    render(
      <ProfileCard
        locale="en"
        profile={{ ...profile, name: null, blog: "javascript:alert(1)" }}
      />
    );

    expect(screen.getByRole("heading", { name: "octocat" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Blog/ })).not.toBeInTheDocument();
    // The card owns no tolerance rows: the languages are derived from the
    // repository list, which the page streams in behind its own boundary.
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders an explicit empty repository state", () => {
    render(<RepoGrid repos={[]} locale="en" />);

    expect(screen.getByText("No repositories to show.")).toBeInTheDocument();
    expect(
      screen.getByText("No public repositories were found for this user.")
    ).toBeInTheDocument();
  });

  it("distinguishes a failed lookup from a user with no repositories", () => {
    // Claiming "no public repositories were found" after a network failure is
    // factually wrong, and the user sees the difference.
    const { unmount } = render(<RepoGrid repos={[]} locale="en" unavailable />);

    expect(
      screen.getByText("Projects could not be loaded right now.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No public repositories were found for this user.")
    ).not.toBeInTheDocument();
    unmount();

    render(<RepoGrid repos={[]} locale="tr" unavailable />);
    expect(screen.getByText("Projeler şu anda yüklenemedi.")).toBeInTheDocument();
  });

  it("still renders repositories when a lookup failed after returning some", () => {
    render(<RepoGrid repos={[repo]} locale="en" unavailable />);

    expect(screen.getByRole("link", { name: /hello-world/ })).toBeInTheDocument();
    expect(
      screen.queryByText("Projects could not be loaded right now.")
    ).not.toBeInTheDocument();
  });

  it("renders repository metadata with a stable date and missing-description fallback", () => {
    render(<RepoGrid repos={[repo]} locale="en" />);

    const project = screen.getByRole("link", { name: /hello-world/ });
    expect(project).toHaveAttribute("href", repo.html_url);
    expect(project).toHaveAttribute("target", "_blank");
    expect(project).toHaveAttribute("rel", "noreferrer");
    expect(screen.getByText("No description is available for this project.")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("Jan 2, 2026")).toBeInTheDocument();
    // The language is part of the sheet's cell reference now.
    expect(within(screen.getByRole("list", { name: "" })).getByText("B.01 · TypeScript")).toBeInTheDocument();
  });

  it("labels a project with its sheet code, grotesk title and figure cells", () => {
    render(<RepoGrid repos={[repo]} locale="en" />);

    const card = screen.getByRole("link", { name: /hello-world/ }).closest("li");
    // A cell on the sheet: nothing rounds, nothing lifts.
    expect(card?.className).not.toMatch(/rounded/);
    expect(card).toHaveClass("hover:shadow-none");

    // The cell reference is notation, not a word, and it names the language.
    const code = screen.getByText("B.01 · TypeScript");
    expect(code).toHaveClass("font-mono", "text-accent");
    const swatch = code.querySelector("span");
    expect(swatch).toHaveAttribute("aria-hidden", "true");
    expect(swatch).toHaveStyle({ backgroundColor: "#3178c6" });

    const title = screen.getByRole("heading", { level: 3, name: /hello-world/ });
    expect(title).toHaveClass("font-sans", "font-black", "tracking-tight");
    // The name is set in ink and turns to the accent on hover, not the reverse.
    const link = screen.getByRole("link", { name: /hello-world/ });
    expect(link).toHaveClass("text-text-primary", "hover:text-accent");
    expect(link.className).not.toContain("font-mono");

    // A long name must ellipsize inside the cell instead of widening the cell's
    // row. An `inline-flex` link is sized by its own content, and nowrap text has
    // a min-content width of the whole name, so only a block-level row capped by
    // the heading lets the truncating span shrink.
    expect(link).toHaveClass("flex", "max-w-full", "min-w-0");
    expect(link.className).not.toContain("inline-flex");
    expect(link.querySelector("span")?.className).toContain("truncate");
  });

  it("states the project measures in hairline cells", () => {
    render(<RepoGrid repos={[repo]} locale="en" />);

    const stars = screen.getByText("1,200");
    const forks = screen.getByText("34");
    // One row, three unrelated figures: bordered cells rather than a <table>
    // with no header cells, each still labelled by its own sr-only text.
    expect(stars).toHaveClass("border-r", "font-mono", "tabular-nums");
    expect(forks).toHaveClass("border-r", "font-mono", "tabular-nums");
    expect(stars.parentElement).toHaveClass("border", "mt-auto");
    expect(stars.parentElement?.children).toHaveLength(3);
    expect(stars.textContent).toBe("Stars: 1,200");
    expect(screen.getByText("Jan 2, 2026")).toHaveClass("text-right", "tabular-nums");
  });

  it("falls back to the default swatch for an unknown language", () => {
    const { unmount } = render(<RepoGrid repos={[repo]} locale="en" />);
    expect(
      screen.getByText("B.01 · TypeScript").querySelector("span")
    ).toHaveStyle({ backgroundColor: "#3178c6" });
    unmount();

    render(<RepoGrid repos={[{ ...repo, language: null }]} locale="en" />);
    // Nothing to colour, so the reference keeps just its cell number.
    expect(screen.getByText("B.01")).toBeInTheDocument();
    expect(screen.queryByText("B.01 · ")).not.toBeInTheDocument();
  });

  it("names the list by how it was chosen", () => {
    // A pinned list is the user's own ordering; a starred list is our ranking.
    // Presenting one as the other would be a claim the data does not support.
    const { unmount } = render(<RepoGrid repos={[repo]} locale="en" />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Featured repositories" })
    ).toBeInTheDocument();
    unmount();

    render(<RepoGrid repos={[repo]} locale="tr" source="pinned" />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Sabitlenmiş repolar" })
    ).toBeInTheDocument();
  });

  it("annotates a card with its topics between the note and the measures", () => {
    const { unmount } = render(
      <RepoGrid
        repos={[{ ...repo, topics: ["cli", "developer-tools", "readme"] }]}
        locale="en"
      />
    );

    const tags = ["cli", "developer-tools", "readme"].map((topic) =>
      screen.getByText(topic)
    );
    // Framed like the figure row and in the same mono face: a tag is annotation
    // on a drawing, not a button, so nothing rounds and nothing lifts.
    for (const tag of tags) {
      expect(tag.tagName).toBe("LI");
      expect(tag).toHaveClass(
        "border",
        "border-border",
        "font-mono",
        "text-text-secondary"
      );
    }

    const measures = screen.getByText("1,200").parentElement;
    expect(tags[0]?.parentElement?.nextElementSibling).toBe(measures);
    unmount();

    // No topics, no empty row: the card keeps its note against the measures.
    render(<RepoGrid repos={[repo]} locale="en" />);
    const card = screen.getByRole("link", { name: /hello-world/ }).closest("li");
    expect(card?.querySelector("ul")).toBeNull();
    expect(
      screen.getByText("1,200").parentElement?.previousElementSibling?.tagName
    ).toBe("P");
  });
});

describe("featured languages", () => {
  afterEach(cleanup);

  it("labels the block and shows only the first three languages", () => {
    render(
      <FeaturedLanguages
        locale="en"
        languages={[
          { name: "TypeScript", count: 4, percent: 60 },
          { name: "Rust", count: 2, percent: 30 },
          { name: "Go", count: 1, percent: 10 },
          { name: "CSS", count: 1, percent: 0 },
        ]}
      />
    );

    // The label, the heading and the note that says how many rows follow.
    expect(screen.getByText("Featured repository languages")).toBeInTheDocument();
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Top 3 languages",
    });
    expect(heading).toHaveClass("font-sans", "font-black", "tracking-tight");
    expect(screen.getByText("TOP 3")).toBeInTheDocument();

    // The fourth language is dropped: the sheet has room for three tolerances.
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveAttribute("aria-label", "TypeScript, 60%");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "60");
    expect(screen.queryByText("CSS")).not.toBeInTheDocument();
  });

  it("formats the language share for the page's own language", () => {
    const { unmount } = render(
      <FeaturedLanguages
        locale="tr"
        languages={[{ name: "TypeScript", count: 1, percent: 33 }]}
      />
    );

    // Turkish writes the sign before the number; English writes it after.
    expect(screen.getByText("%33")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-label",
      "TypeScript %33"
    );
    unmount();

    render(
      <FeaturedLanguages
        locale="en"
        languages={[{ name: "TypeScript", count: 1, percent: 33 }]}
      />
    );
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("draws one framed tolerance bar per language in its Linguist color", () => {
    render(
      <FeaturedLanguages
        locale="en"
        languages={[
          { name: "TypeScript", count: 3, percent: 60 },
          { name: "Brainfuck", count: 2, percent: 40 },
        ]}
      />
    );

    const [typescript, unknown] = screen.getAllByRole("progressbar");

    // The framed track keeps the pair of selectors the print stylesheet
    // repaints: `[role="progressbar"]` and its single `div` fill.
    expect(typescript).toHaveClass("h-2", "border", "overflow-hidden");
    expect(typescript.className).not.toContain("rounded");

    const fill = typescript.firstElementChild as HTMLElement;
    expect(fill.tagName).toBe("DIV");
    expect(fill).toHaveStyle({ width: "60%", backgroundColor: "#3178c6" });
    expect(fill.className).not.toContain("gradient");
    expect(unknown.firstElementChild as HTMLElement).toHaveStyle({
      backgroundColor: "#8a8578",
    });

    // The row reads name, bar, share on one measure, in that order.
    const row = typescript.parentElement;
    expect(row?.tagName).toBe("LI");
    expect(row?.textContent).toBe("TypeScript60%");
    expect(row?.className).toContain("grid-cols-[6rem_1fr_3.5rem]");
  });
});

describe("profile repository block", () => {
  const displayName = "The Octocat";
  const description = "GitHub mascot";

  beforeEach(() => {
    githubMocks.getPinnedRepos.mockResolvedValue(null);
    githubMocks.getTopRepos.mockResolvedValue([repo]);
  });

  afterEach(() => {
    cleanup();
    githubMocks.getPinnedRepos.mockReset();
    githubMocks.getTopRepos.mockReset();
  });

  async function renderRepos(
    props: Partial<Parameters<typeof ProfileRepos>[0]> = {},
  ) {
    return render(
      await ProfileRepos({
        username: "octocat",
        locale: "en",
        profile,
        displayName,
        description,
        ...props,
      }),
    );
  }

  function rankedRepo(id: number, language: string | null): GitHubRepo {
    return {
      ...repo,
      id,
      name: `repo-${id}`,
      full_name: `octocat/repo-${id}`,
      html_url: `https://github.com/octocat/repo-${id}`,
      language,
    };
  }

  it("shows the repositories the user pinned instead of ranking their own work", async () => {
    githubMocks.getPinnedRepos.mockResolvedValue([repo]);

    await renderRepos();

    // A pinned list is the user's own ordering; a starred list is our ranking.
    expect(
      screen.getByRole("heading", { level: 2, name: "Pinned repositories" })
    ).toBeInTheDocument();
    // The ranking is the fallback: it is not paid for when the pinned list
    // answers, and the canonical login is what gets looked up.
    expect(githubMocks.getPinnedRepos).toHaveBeenCalledWith("octocat");
    expect(githubMocks.getTopRepos).not.toHaveBeenCalled();
  });

  it("falls back to the ranked repositories when nothing is pinned", async () => {
    githubMocks.getPinnedRepos.mockResolvedValue([]);

    await renderRepos();

    expect(
      screen.getByRole("heading", { level: 2, name: "Featured repositories" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hello-world/ })).toBeInTheDocument();
    expect(githubMocks.getTopRepos).toHaveBeenCalledWith("octocat", 6);
  });

  it("uses only the six displayed repositories for the sheet and the languages", async () => {
    githubMocks.getTopRepos.mockResolvedValue([
      rankedRepo(1, "TypeScript"),
      rankedRepo(2, "JavaScript"),
      rankedRepo(3, "JavaScript"),
      rankedRepo(4, "JavaScript"),
      rankedRepo(5, "JavaScript"),
      rankedRepo(6, "JavaScript"),
      rankedRepo(7, "Python"),
    ]);

    const { container } = await renderRepos();

    expect(container.querySelectorAll("li.card-premium")).toHaveLength(6);
    expect(screen.queryByRole("link", { name: /repo-7/ })).not.toBeInTheDocument();
    // The tolerances are derived from the same six, not from the larger page.
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute("aria-label", "JavaScript, 83%");
  });

  it("keeps the profile and reports a failed repository lookup once", async () => {
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    githubMocks.getTopRepos.mockRejectedValue(
      new GitHubSecondaryRateLimitError({ status: 429, retryAfterMs: 1_000 })
    );

    await renderRepos();

    // No projects, no language tolerances, and an empty state that admits the
    // failure instead of claiming the user has no public repositories.
    expect(
      screen.getByText("Projects could not be loaded right now.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("No public repositories were found for this user.")).not.toBeInTheDocument();

    // The failure stays observable exactly once, with the short code only.
    expect(consoleWarn).toHaveBeenCalledOnce();
    const [message] = consoleWarn.mock.calls[0] as [string];
    expect(message).toContain("secondary-rate-limit");
    expect(message).toContain("status 429");
    expect(message).not.toContain("Bearer");
    // A handled degradation must not trip the Next.js dev error overlay.
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("states the sheet's own section spacing around both blocks", async () => {
    const { container } = await renderRepos();

    // The languages and the grid are one detail of the sheet, so they share the
    // frame the profile card is separated by.
    const section = container.querySelector("div.mt-10");
    expect(section).not.toBeNull();
    expect(section).toHaveClass("sm:mt-12");
    expect(section?.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(section?.querySelector("section")).not.toBeNull();
  });

  it("describes the person and the displayed projects as structured data", async () => {
    const { container } = await renderRepos();

    const [block] = [...container.querySelectorAll('script[type="application/ld+json"]')];
    const payload = JSON.parse((block?.textContent ?? "").replace(/\\u003c/g, "<")) as {
      '@type': string;
      url: string;
      mainEntity: { '@type': string; name: string; alternateName: string; knowsAbout: string[] };
      hasPart: Array<{ '@type': string; name: string; author: { '@id': string } }>;
    };

    // The data block is emitted with the block it describes, and describes only
    // what the sheet actually shows.
    expect(payload['@type']).toBe("ProfilePage");
    expect(payload.mainEntity).toMatchObject({
      '@type': "Person",
      name: displayName,
      alternateName: "@octocat",
      knowsAbout: ["TypeScript"],
    });
    expect(payload.hasPart).toHaveLength(1);
    expect(payload.hasPart[0]).toMatchObject({
      '@type': "SoftwareSourceCode",
      name: "hello-world",
      author: { '@id': "https://git-to-portfolio.vercel.app/octocat#person" },
    });
  });
});

describe("repository block skeleton", () => {
  afterEach(cleanup);

  it("announces itself as a busy status in the reader's language", () => {
    // It takes its locale as a prop from the page, which already resolved it,
    // so there is no header to read back here.
    for (const locale of LOCALES) {
      const { unmount } = render(<ReposSkeleton locale={locale} />);

      expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText(getDictionary(locale).profile.profileLoading)).toHaveClass(
        "sr-only"
      );
      unmount();
    }
  });

  it("takes the space of the block it stands in for", () => {
    // Same frame as the real block, so the swap-in does not shift the sheet.
    render(<ReposSkeleton locale="en" />);

    const status = screen.getByRole("status");
    expect(status).toHaveClass("mt-10", "sm:mt-12");
  });

  it("mirrors the languages block and the six-cell grid", () => {
    const { container } = render(<ReposSkeleton locale="en" />);

    // The label line and the heading line above the three tolerance rows.
    expect(
      container.querySelectorAll('[class*="grid-cols-[6rem_1fr_3.5rem]"]')
    ).toHaveLength(3);
    // Six cells, the number of featured repositories the page shows, each one
    // ending in a hairline row of three measure cells.
    expect(container.querySelectorAll("li.card-premium")).toHaveLength(6);
    expect(container.querySelectorAll('[class*="mt-auto"]')).toHaveLength(6);
    expect(container.querySelector('[class*="lg:grid-cols-3"]')).not.toBeNull();
  });

  it("uses token colours only and never reaches paper", () => {
    const { container } = render(<ReposSkeleton locale="en" />);

    // One palette for both themes, and no hand-written colour to drift.
    expect(container.querySelector('[class*="bg-surface-elevated"]')).not.toBeNull();
    expect(container.querySelectorAll("[style]")).toHaveLength(0);
    expect(container.innerHTML).not.toContain("dark:");
    // A skeleton is replaced before anything is printed, but a printed sheet
    // full of grey boxes would still be a broken document.
    expect(container.firstElementChild).toHaveClass("no-print");
    // Nothing in this sheet is rounded.
    expect(container.innerHTML).not.toContain("rounded");
  });
});
