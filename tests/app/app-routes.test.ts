import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: navigationMocks.push }),
  useSearchParams: () => new URLSearchParams(),
}));

import HomePage from "../../app/page";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";
import { getSiteUrl } from "../../lib/site";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe("home page", () => {
  afterEach(() => {
    restoreEnv("NEXT_PUBLIC_SITE_URL", originalSiteUrl);
  });

  it("renders the selected locale, examples, and all workflow steps", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://portfolio.example.test/";
    const element = await HomePage({ searchParams: Promise.resolve({ lang: "en" }) });
    const html = await import("react-dom/server").then(({ renderToStaticMarkup }) =>
      renderToStaticMarkup(element)
    );

    expect(getSiteUrl()).toBe("https://portfolio.example.test");
    expect(html).toContain("Your portfolio in three steps");
    expect(html).toContain("/torvalds?lang=en");
    expect(html).toContain("/gaearon?lang=en");
    expect(html).toContain("/yyx990803?lang=en");
  });

  it("falls back to Turkish for an unsupported locale", async () => {
    const element = await HomePage({
      searchParams: Promise.resolve({ lang: ["en", "de"] }),
    });
    const { renderToStaticMarkup } = await import("react-dom/server");
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Üç adımda portföy");
    expect(html).toContain('href="/torvalds"');
  });
});

describe("metadata routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://metadata.example.test/portfolio///";
  });

  afterEach(() => {
    restoreEnv("NEXT_PUBLIC_SITE_URL", originalSiteUrl);
    vi.useRealTimers();
  });

  it("builds robots rules with the configured canonical site URL", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://metadata.example.test/portfolio/sitemap.xml",
    });
  });

  it("builds the home and example profile sitemap with one stable timestamp", () => {
    const entries = sitemap();

    expect(entries.map(({ url }) => url)).toEqual([
      "https://metadata.example.test/portfolio/",
      "https://metadata.example.test/portfolio/torvalds",
      "https://metadata.example.test/portfolio/gaearon",
      "https://metadata.example.test/portfolio/yyx990803",
    ]);
    expect(entries.every(({ changeFrequency }) => changeFrequency === "weekly")).toBe(true);
    expect(entries[0]?.priority).toBe(1);
    expect(entries.slice(1).every(({ priority }) => priority === 0.8)).toBe(true);

    const timestamps = entries.map(({ lastModified }) => {
      if (lastModified instanceof Date) return lastModified.getTime();
      expect(lastModified).toEqual(expect.any(String));
      return String(lastModified);
    });
    expect(timestamps[0]).toEqual(expect.any(Number));
    expect(new Set(timestamps).size).toBe(1);
  });
});
