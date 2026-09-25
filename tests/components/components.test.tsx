import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppError from "../../app/error";
import LocaleSwitcher from "../../components/LocaleSwitcher";
import PrintButton from "../../components/PrintButton";
import ProfileCard from "../../components/ProfileCard";
import RepoGrid from "../../components/RepoGrid";
import SearchForm from "../../components/SearchForm";
import SiteHeader from "../../components/SiteHeader";
import type { GitHubProfile, GitHubRepo } from "../../lib/github";

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

  it("renders a safe profile, external links, and only the top three languages", () => {
    render(
      <ProfileCard
        locale="en"
        profile={{ ...profile, name: "   " }}
        topLanguages={[
          { name: "TypeScript", count: 4, percent: 60 },
          { name: "Rust", count: 2, percent: 30 },
          { name: "Go", count: 1, percent: 10 },
          { name: "CSS", count: 1, percent: 0 },
        ]}
      />
    );

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

    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(3);
    expect(progressBars[0]).toHaveAttribute("aria-label", "TypeScript, 60 percent");
  });

  it("omits unsafe blog schemes and displays a login fallback name", () => {
    render(
      <ProfileCard
        locale="en"
        profile={{ ...profile, name: null, blog: "javascript:alert(1)" }}
        topLanguages={[]}
      />
    );

    expect(screen.getByRole("heading", { name: "octocat" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Blog/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders an explicit empty repository state", () => {
    render(<RepoGrid repos={[]} locale="en" />);

    expect(screen.getByText("No repositories to show.")).toBeInTheDocument();
    expect(
      screen.getByText("No public repositories were found for this user.")
    ).toBeInTheDocument();
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
    expect(within(screen.getByRole("list", { name: "" })).getByText("TypeScript")).toBeInTheDocument();
  });
});
