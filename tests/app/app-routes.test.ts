import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: navigationMocks.push }),
  useSearchParams: () => new URLSearchParams(),
}));

import HomePage, { generateMetadata as HomeMetadata } from "../../app/page";
import manifest from "../../app/manifest";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";
import { LOCALES, LOCALE_TAGS, withLocale } from "../../lib/i18n";
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

  it("builds localized home canonical, hreflang and social metadata", async () => {
    const metadata = await HomeMetadata({ searchParams: Promise.resolve({ lang: "de" }) });

    expect(metadata.title).toBe("Git-to-Portfolio");
    expect(metadata.description).toBe(
      "Erstelle automatisch ein einfaches, druckbares Entwicklerportfolio aus einem GitHub-Profil."
    );
    expect(metadata.alternates).toEqual({
      canonical: "https://git-to-portfolio.vercel.app/?lang=de",
      languages: {
        "tr-TR": "https://git-to-portfolio.vercel.app/",
        "en-US": "https://git-to-portfolio.vercel.app/?lang=en",
        "de-DE": "https://git-to-portfolio.vercel.app/?lang=de",
        "es-ES": "https://git-to-portfolio.vercel.app/?lang=es",
        "x-default": "https://git-to-portfolio.vercel.app/",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "https://git-to-portfolio.vercel.app/?lang=de",
      locale: "de_DE",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/opengraph-image"],
    });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("canonicalizes the default locale to the clean home URL", async () => {
    const metadata = await HomeMetadata({ searchParams: Promise.resolve({ lang: "tr" }) });

    expect(metadata.alternates?.canonical).toBe("https://git-to-portfolio.vercel.app/");
    expect(metadata.openGraph).toMatchObject({
      url: "https://git-to-portfolio.vercel.app/",
      locale: "tr_TR",
    });
  });

  it("resolves home metadata URLs against a configured site origin", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://portfolio.example.test/";

    const metadata = await HomeMetadata({ searchParams: Promise.resolve({ lang: "es" }) });

    expect(metadata.alternates?.canonical).toBe("https://portfolio.example.test/?lang=es");
    expect(metadata.alternates?.languages?.["es-ES"]).toBe(
      "https://portfolio.example.test/?lang=es"
    );
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

  it("builds the home and example profile sitemap without a fabricated lastmod", () => {
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

    // The build time is not a real modification date, so lastmod is omitted
    // rather than stamped with the deploy timestamp.
    expect(entries.every((entry) => !("lastModified" in entry))).toBe(true);
  });

  it("exposes absolute hreflang alternates for every supported locale plus x-default", () => {
    const siteUrl = "https://metadata.example.test/portfolio";
    const pathnames = ["/", "/torvalds", "/gaearon", "/yyx990803"] as const;
    const entries = sitemap();

    expect(entries).toHaveLength(pathnames.length);

    pathnames.forEach((pathname, index) => {
      const languages = entries[index]?.alternates?.languages;

      expect(languages).toBeDefined();
      expect(Object.keys(languages ?? {})).toEqual([
        ...LOCALES.map((locale) => LOCALE_TAGS[locale]),
        "x-default",
      ]);
      expect(languages).toEqual({
        "tr-TR": `${siteUrl}${withLocale(pathname, "tr")}`,
        "en-US": `${siteUrl}${withLocale(pathname, "en")}`,
        "de-DE": `${siteUrl}${withLocale(pathname, "de")}`,
        "es-ES": `${siteUrl}${withLocale(pathname, "es")}`,
        "x-default": `${siteUrl}${withLocale(pathname, "tr")}`,
      });

      for (const [tag, url] of Object.entries(languages ?? {}) as Array<[string, string]>) {
        // Absolute and parseable, with the repeated slashes of
        // NEXT_PUBLIC_SITE_URL already normalised away.
        expect(`${tag}: ${url}`).toMatch(
          /^[\w-]+: https:\/\/metadata\.example\.test\/portfolio\/\S*$/
        );
        expect(url).not.toContain("//portfolio//");
        expect(new URL(url).protocol).toBe("https:");
      }
    });
  });

  it("resolves the home alternates to the normalized site URL", () => {
    const [home] = sitemap();

    expect(home?.alternates?.languages).toEqual({
      "tr-TR": "https://metadata.example.test/portfolio/",
      "en-US": "https://metadata.example.test/portfolio/?lang=en",
      "de-DE": "https://metadata.example.test/portfolio/?lang=de",
      "es-ES": "https://metadata.example.test/portfolio/?lang=es",
      "x-default": "https://metadata.example.test/portfolio/",
    });
  });
});

describe("web app manifest", () => {
  it("describes the installable Git-to-Portfolio app", () => {
    const result = manifest();
    const icons = result.icons ?? [];

    expect(result.name).toBe("Git-to-Portfolio");
    expect(result.short_name).toBe("Git-to-Portfolio");
    expect(result.start_url).toBe("/");
    expect(result.scope).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.theme_color).toBe("#0a0a0c");
    expect(result.background_color).toBe("#0a0a0c");
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon.src).toEqual(expect.any(String));
      expect(icon.src.length).toBeGreaterThan(0);
    }
  });
});
