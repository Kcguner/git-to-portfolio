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
import {
  getDictionary,
  LOCALES,
  LOCALE_TAGS,
  OPEN_GRAPH_LOCALES,
  withLocale,
  dictionaries,
} from "../../lib/i18n";
import { EXAMPLES } from "../../lib/examples";
import { getSiteUrl } from "../../lib/site";

const originalSiteUrl = process.env.SITE_URL;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe("home page", () => {
  afterEach(() => {
    restoreEnv("SITE_URL", originalSiteUrl);
  });

  it("renders the selected locale, examples, and all workflow steps", async () => {
    process.env.SITE_URL = "https://portfolio.example.test/";
    const element = await HomePage({ searchParams: Promise.resolve({ lang: "en" }) });
    const html = await import("react-dom/server").then(({ renderToStaticMarkup }) =>
      renderToStaticMarkup(element)
    );

    expect(getSiteUrl()).toBe("https://portfolio.example.test");
    expect(html).toContain("Your portfolio in three steps");

    // Derived from EXAMPLES so adding or removing an example cannot leave a
    // stale expectation behind.
    expect(EXAMPLES.length).toBeGreaterThan(0);
    for (const example of EXAMPLES) {
      expect(html).toContain(`/${example.username}?lang=en`);
      expect(html).toContain(dictionaries.en.home.exampleDescriptions[example.descriptionKey]);
    }
  });

  it("leads the example list with the site owner", () => {
    // The owner is the point of the first card, so the order is part of the
    // contract rather than an accident of the array.
    expect(EXAMPLES[0].descriptionKey).toBe("kcguner");
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
    expect(metadata.keywords).toEqual(dictionaries.de.metadata.homeKeywords);
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
      // Every other language the site serves, so a share gets the right card.
      alternateLocale: ["tr_TR", "en_US", "es_ES"],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      // One card, the one for this page's language, with a localized alt.
      images: [
        {
          url: "https://git-to-portfolio.vercel.app/opengraph-image/de",
          alt: dictionaries.de.metadata.ogImage.alt,
          type: "image/png",
          width: 1200,
          height: 630,
        },
      ],
    });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("gives every language its own card, description and keywords", async () => {
    for (const locale of LOCALES) {
      const metadata = await HomeMetadata({
        searchParams: Promise.resolve({ lang: locale }),
      });
      const [image] = (metadata.twitter?.images ?? []) as Array<{ url: string; alt: string }>;

      // The card is addressed by the language, not by a query parameter, so a
      // crawler that drops the page query still gets a rendered image.
      expect(image?.url).toBe(`https://git-to-portfolio.vercel.app/opengraph-image/${locale}`);
      expect(image?.alt).toBe(getDictionary(locale).metadata.ogImage.alt);
      expect(metadata.openGraph?.locale).toBe(
        OPEN_GRAPH_LOCALES[locale],
      );
      expect(metadata.keywords).toEqual(getDictionary(locale).metadata.homeKeywords);
    }
  });

  it("describes the visible steps as structured data in the page's language", async () => {
    for (const locale of LOCALES) {
      const element = await HomePage({
        searchParams: Promise.resolve({ lang: locale }),
      });
      const { renderToStaticMarkup } = await import("react-dom/server");
      const html = renderToStaticMarkup(element);
      const dictionary = getDictionary(locale);
      // Rendered without the root layout, so this is the page's only block.
      const [howTo] = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
        .map(([, payload]) => JSON.parse((payload ?? "").replace(/\\u003c/g, "<"))) as [
          {
            '@type': string;
            name: string;
            inLanguage: string;
            step: Array<{ position: number; name: string; text: string }>;
          },
        ];

      expect(howTo['@type']).toBe("HowTo");
      expect(howTo.name).toBe(dictionary.home.howTitle);
      expect(howTo.inLanguage).toBe(LOCALE_TAGS[locale]);
      // The steps are the strings the page renders, not crawler-only copy.
      expect(howTo.step).toEqual(
        dictionary.home.steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.title,
          text: step.text,
        })),
      );
    }
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
    process.env.SITE_URL = "https://portfolio.example.test/";

    const metadata = await HomeMetadata({ searchParams: Promise.resolve({ lang: "es" }) });

    expect(metadata.alternates?.canonical).toBe("https://portfolio.example.test/?lang=es");
    expect(metadata.alternates?.languages?.["es-ES"]).toBe(
      "https://portfolio.example.test/?lang=es"
    );
  });
});

describe("metadata routes", () => {
  beforeEach(() => {
    process.env.SITE_URL = "https://metadata.example.test/portfolio///";
  });

  afterEach(() => {
    restoreEnv("SITE_URL", originalSiteUrl);
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
    const pathnames = ["/", "/kcguner", "/torvalds", "/gaearon", "/yyx990803"];

    // One entry per language, not one entry per page: a localized URL that is
    // only reachable as an alternates href of its siblings is discovered late,
    // if at all.
    expect(entries).toHaveLength(pathnames.length * LOCALES.length);
    expect(entries.slice(0, LOCALES.length).map(({ url }) => url)).toEqual([
      "https://metadata.example.test/portfolio/",
      "https://metadata.example.test/portfolio/?lang=en",
      "https://metadata.example.test/portfolio/?lang=de",
      "https://metadata.example.test/portfolio/?lang=es",
    ]);
    expect(entries.every(({ changeFrequency }) => changeFrequency === "weekly")).toBe(true);
    expect(entries.slice(0, LOCALES.length).every(({ priority }) => priority === 1)).toBe(
      true,
    );
    expect(entries.slice(LOCALES.length).every(({ priority }) => priority === 0.8)).toBe(
      true,
    );

    // The build time is not a real modification date, so lastmod is omitted
    // rather than stamped with the deploy timestamp.
    expect(entries.every((entry) => !("lastModified" in entry))).toBe(true);
  });

  it("submits the owner's profile for indexing, and keeps the other profiles", () => {
    const urls = sitemap().map(({ url }) => url);

    // The site owner has to be discoverable in search, not only linked from the
    // home page. The remaining profiles are no longer showcased, but they are
    // still real indexable pages and dropping them would lose long-tail
    // discovery, so the list is not a projection of EXAMPLES.
    expect(urls).toContain("https://metadata.example.test/portfolio/kcguner");
    expect(urls).toContain("https://metadata.example.test/portfolio/gaearon");
    expect(urls).toContain("https://metadata.example.test/portfolio/yyx990803");
  });

  it("exposes absolute hreflang alternates for every supported locale plus x-default", () => {
    const siteUrl = "https://metadata.example.test/portfolio";
    const pathnames = ["/", "/kcguner", "/torvalds", "/gaearon", "/yyx990803"] as const;
    const entries = sitemap();

    expect(entries).toHaveLength(pathnames.length * LOCALES.length);

    pathnames.forEach((pathname, index) => {
      const localized = entries.slice(index * LOCALES.length, (index + 1) * LOCALES.length);
      const expectedLanguages = {
        "tr-TR": `${siteUrl}${withLocale(pathname, "tr")}`,
        "en-US": `${siteUrl}${withLocale(pathname, "en")}`,
        "de-DE": `${siteUrl}${withLocale(pathname, "de")}`,
        "es-ES": `${siteUrl}${withLocale(pathname, "es")}`,
        "x-default": `${siteUrl}${withLocale(pathname, "tr")}`,
      };

      // Every language's entry repeats the whole cluster, and each one is its
      // own localized URL.
      expect(localized.map(({ url }) => url)).toEqual(
        LOCALES.map((locale) => `${siteUrl}${withLocale(pathname, locale)}`),
      );

      localized.forEach((entry, localeIndex) => {
        const languages = entry.alternates?.languages;

        expect(Object.keys(languages ?? {})).toEqual([
          ...LOCALES.map((locale) => LOCALE_TAGS[locale]),
          "x-default",
        ]);
        expect(languages).toEqual(expectedLanguages);
        expect(entry.url).toBe(`${siteUrl}${withLocale(pathname, LOCALES[localeIndex])}`);

        for (const [tag, url] of Object.entries(languages ?? {}) as Array<[string, string]>) {
          // Absolute and parseable, with the repeated slashes of
          // SITE_URL already normalised away.
          expect(`${tag}: ${url}`).toMatch(
            /^[\w-]+: https:\/\/metadata\.example\.test\/portfolio\/\S*$/
          );
          expect(url).not.toContain("//portfolio//");
          expect(new URL(url).protocol).toBe("https:");
        }
      });
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
