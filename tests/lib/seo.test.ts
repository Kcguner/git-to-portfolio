import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  getDictionary,
  getLocaleAlternates,
  getLocaleFromQueryValues,
  LOCALES,
  LOCALE_TAGS,
  OPEN_GRAPH_LOCALES,
  withLocale,
} from "../../lib/i18n";
import {
  getAbsoluteLocaleAlternates,
  getAbsoluteUrl,
  getAlternateOpenGraphLocales,
  getHomeKeywords,
  getHomeOpenGraphImagePath,
  getHowToJsonLd,
  getLocaleAlternatesMetadata,
  getLocaleFromImageId,
  getOpenGraphLocale,
  getProfileJsonLd,
  getProfileKeywords,
  getProfileOpenGraphImagePath,
  getProfilePathname,
  getProfileSameAs,
  getSiteJsonLd,
  getSocialImageMetadata,
  INDEXABLE_ROBOTS,
  NO_INDEX_ROBOTS,
  serializeJsonLd,
  SITE_NAME,
  SOCIAL_IMAGE_SIZE,
} from "../../lib/seo";
import { getSafeExternalHttpUrl } from "../../lib/site";

const originalSiteUrl = process.env.SITE_URL;

beforeEach(() => {
  process.env.SITE_URL = "https://seo.example.test/portfolio/";
});

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = originalSiteUrl;
});

const PROFILE = {
  locale: "de" as const,
  pathname: "/octocat",
  displayName: "The Octocat",
  login: "octocat",
  description: "GitHub mascot",
  avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  profileUrl: "https://github.com/octocat",
  createdAt: "2011-01-25T18:44:36Z",
  blogUrl: null,
  twitterUsername: null,
  repositories: [
    {
      name: "repo-1",
      url: "https://github.com/octocat/repo-1",
      description: "First repository",
      language: "TypeScript",
      stars: 12,
    },
  ],
  topLanguages: [{ name: "TypeScript", count: 1, percent: 100 }],
};

describe("locale-aware SEO URLs", () => {
  it("keeps the default locale on a clean URL", () => {
    expect(withLocale("/", DEFAULT_LOCALE)).toBe("/");
    expect(withLocale("/ada", DEFAULT_LOCALE, "?lang=en&tab=repos")).toBe("/ada?tab=repos");
  });

  it("removes duplicate locale values when creating a localized URL", () => {
    expect(withLocale("/ada", "de", "?lang=en&lang=tr")).toBe("/ada?lang=de");
  });

  it("builds one hreflang target per supported locale", () => {
    expect(getLocaleAlternates("/ada")).toEqual({
      [LOCALE_TAGS.tr]: "/ada",
      [LOCALE_TAGS.en]: "/ada?lang=en",
      [LOCALE_TAGS.de]: "/ada?lang=de",
      [LOCALE_TAGS.es]: "/ada?lang=es",
      "x-default": "/ada",
    });
  });
});

describe("client locale query normalization", () => {
  it("matches the server representation for a single value", () => {
    expect(getLocaleFromQueryValues(["en"])).toBe("en");
  });

  it("keeps the safe default for repeated values on both sides", () => {
    expect(getLocaleFromQueryValues(["en", "de"])).toBe(DEFAULT_LOCALE);
  });
});

describe("localized URLs", () => {
  it("keeps a base path from SITE_URL instead of resolving against the origin", () => {
    // `new URL('/x', base)` would drop the subpath, which would break every
    // canonical, hreflang and image URL on a deployment behind one.
    expect(getAbsoluteUrl("/octocat?lang=de")).toBe(
      "https://seo.example.test/portfolio/octocat?lang=de",
    );
    expect(getAbsoluteLocaleAlternates("/octocat")).toEqual({
      "tr-TR": "https://seo.example.test/portfolio/octocat",
      "en-US": "https://seo.example.test/portfolio/octocat?lang=en",
      "de-DE": "https://seo.example.test/portfolio/octocat?lang=de",
      "es-ES": "https://seo.example.test/portfolio/octocat?lang=es",
      "x-default": "https://seo.example.test/portfolio/octocat",
    });
  });

  it("points the canonical at the page's own language", () => {
    expect(getLocaleAlternatesMetadata("/", "tr").canonical).toBe(
      "https://seo.example.test/portfolio/",
    );
    expect(getLocaleAlternatesMetadata("/", "es").canonical).toBe(
      "https://seo.example.test/portfolio/?lang=es",
    );
    // The cluster is identical whichever language asks for it.
    expect(getLocaleAlternatesMetadata("/", "es").languages).toEqual(
      getLocaleAlternatesMetadata("/", "tr").languages,
    );
  });

  it("builds one social card URL per language, addressed by path", () => {
    expect(LOCALES.map(getHomeOpenGraphImagePath)).toEqual([
      "/opengraph-image/tr",
      "/opengraph-image/en",
      "/opengraph-image/de",
      "/opengraph-image/es",
    ]);
    expect(getProfilePathname("octo cat")).toBe("/octo%20cat");
    expect(getProfileOpenGraphImagePath("octocat", "es")).toBe(
      "/octocat/opengraph-image/es",
    );
  });

  it("resolves an unknown card id to the default language instead of throwing", () => {
    // A stale or hand-typed image URL must still render a card.
    expect(getLocaleFromImageId("fr")).toBe("tr");
    expect(getLocaleFromImageId(undefined)).toBe("tr");
    expect(getLocaleFromImageId(null)).toBe("tr");
    expect(getLocaleFromImageId("es")).toBe("es");
  });
});

describe("social card metadata", () => {
  it("describes one image with its dimensions, type and alt text", () => {
    expect(getSocialImageMetadata("/opengraph-image/de", "Kartenalt")).toEqual([
      {
        url: "https://seo.example.test/portfolio/opengraph-image/de",
        alt: "Kartenalt",
        type: "image/png",
        width: SOCIAL_IMAGE_SIZE.width,
        height: SOCIAL_IMAGE_SIZE.height,
      },
    ]);
  });

  it("lists every other language as an Open Graph alternate", () => {
    for (const locale of LOCALES) {
      const alternates = getAlternateOpenGraphLocales(locale);

      expect(alternates).toHaveLength(LOCALES.length - 1);
      expect(alternates).not.toContain(OPEN_GRAPH_LOCALES[locale]);
      // Derived from the served locales, so it can never name a language the
      // site does not have.
      expect(new Set(alternates)).toEqual(
        new Set(
          LOCALES.filter((candidate) => candidate !== locale).map(
            (candidate) => OPEN_GRAPH_LOCALES[candidate],
          ),
        ),
      );
      expect(getOpenGraphLocale(locale)).toBe(OPEN_GRAPH_LOCALES[locale]);
    }
  });

  it("uses a distinct card, alt text and keyword set per language", () => {
    const alts = LOCALES.map(
      (locale) => getSocialImageMetadata(getHomeOpenGraphImagePath(locale), "")[0]?.url,
    );
    const cardAlts = LOCALES.map((locale) => getDictionary(locale).metadata.ogImage.alt);
    const keywordSets = LOCALES.map((locale) => getHomeKeywords(locale).join("|"));

    expect(new Set(alts).size).toBe(LOCALES.length);
    expect(new Set(cardAlts).size).toBe(LOCALES.length);
    expect(new Set(keywordSets).size).toBe(LOCALES.length);
  });

  it("includes the person in the profile keywords, in every language", () => {
    for (const locale of LOCALES) {
      const keywords = getProfileKeywords(locale, "The Octocat");

      expect(keywords.length).toBeGreaterThan(1);
      expect(keywords.filter((keyword) => keyword.includes("The Octocat")).length)
        .toBeGreaterThan(0);
    }
  });
});

describe("structured data", () => {
  it("describes the site once, in the reader's language", () => {
    for (const locale of LOCALES) {
      const graph = (getSiteJsonLd(locale)["@graph"] ?? []) as Array<
        Record<string, unknown>
      >;

      expect(getSiteJsonLd(locale)["@context"]).toBe("https://schema.org");
      expect(graph.map((node) => node["@type"])).toEqual(["WebSite", "WebApplication"]);
      for (const node of graph) {
        expect(node.name).toBe(SITE_NAME);
        expect(node.description).toBe(getDictionary(locale).metadata.homeDescription);
        expect(node.inLanguage).toBe(LOCALE_TAGS[locale]);
      }
    }
  });

  it("keeps the visible steps and numbers them from one", () => {
    const howTo = getHowToJsonLd("es") as {
      '@type': string;
      inLanguage: string;
      step: Array<{ position: number; name: string; text: string }>;
    };
    const steps = getDictionary("es").home.steps;

    expect(howTo['@type']).toBe("HowTo");
    expect(howTo.inLanguage).toBe("es-ES");
    expect(howTo.step).toHaveLength(steps.length);
    expect(howTo.step.map(({ position }) => position)).toEqual([1, 2, 3]);
    expect(howTo.step.map(({ name }) => name)).toEqual(steps.map((step) => step.title));
    expect(howTo.step.map(({ text }) => text)).toEqual(steps.map((step) => step.text));
  });

  it("describes the person, the projects and the languages of a profile page", () => {
    const node = getProfileJsonLd(PROFILE) as Record<string, never> & {
      '@id': string;
      url: string;
      inLanguage: string;
      mainEntity: { '@id': string; knowsAbout: string[] };
      hasPart: Array<Record<string, unknown>>;
    };

    // The page URL carries the language; the entity id does not, so the four
    // languages describe one person.
    expect(node.url).toBe("https://seo.example.test/portfolio/octocat?lang=de");
    expect(node.inLanguage).toBe("de-DE");
    expect(node['@id']).toBe("https://seo.example.test/portfolio/octocat#webpage");
    expect(node.mainEntity['@id']).toBe("https://seo.example.test/portfolio/octocat#person");
    expect(node.mainEntity.knowsAbout).toEqual(["TypeScript"]);
    expect(node.hasPart).toHaveLength(1);
    expect(node.hasPart[0]).toMatchObject({
      '@type': "SoftwareSourceCode",
      codeRepository: "https://github.com/octocat/repo-1",
      author: { '@id': "https://seo.example.test/portfolio/octocat#person" },
      interactionStatistic: {
        '@type': "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: 12,
      },
    });
  });

  it("leaves out what the page does not show", () => {
    const withoutRepositories = getProfileJsonLd({ ...PROFILE, repositories: [] }) as Record<
      string,
      unknown
    >;
    const withoutLanguage = getProfileJsonLd({
      ...PROFILE,
      repositories: [{ ...PROFILE.repositories[0]!, description: null, language: null }],
    }) as { hasPart: Array<Record<string, unknown>> };

    expect(withoutRepositories.hasPart).toBeUndefined();
    // A repository with no description or language is described with neither,
    // rather than with invented text.
    expect(withoutLanguage.hasPart[0]).not.toHaveProperty("description");
    expect(withoutLanguage.hasPart[0]).not.toHaveProperty("programmingLanguage");
  });

  it("normalizes the person's external links the way the page links them", () => {
    expect(
      getProfileSameAs("https://github.com/octocat", "octocat.dev", "octocat"),
    ).toEqual([
      "https://github.com/octocat",
      "https://octocat.dev/",
      "https://x.com/octocat",
    ]);
    // An unusable blog value drops the link instead of publishing it.
    expect(getProfileSameAs("https://github.com/octocat", "javascript:alert(1)", null)).toEqual(
      ["https://github.com/octocat"],
    );
  });

  it("escapes markup so profile data cannot close the data block", () => {
    // A GitHub bio or repository description is attacker-controlled text.
    const serialized = serializeJsonLd({ description: "</script><img src=x onerror=alert(1)>" });

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c");
    expect(JSON.parse(serialized.replace(/\\u003c/g, "<"))).toEqual({
      description: "</script><img src=x onerror=alert(1)>",
    });
  });
});

describe("indexing directives", () => {
  it("keeps the indexable and noindex forms exact inverses", () => {
    const googleBot = INDEXABLE_ROBOTS.googleBot as { index?: boolean; follow?: boolean };

    expect(INDEXABLE_ROBOTS).toMatchObject({ index: true, follow: true });
    expect(NO_INDEX_ROBOTS).toMatchObject({ index: false, follow: false });
    expect(NO_INDEX_ROBOTS.googleBot).toEqual({
      index: !googleBot.index,
      follow: !googleBot.follow,
    });
  });
});

describe("getSafeExternalHttpUrl", () => {
  it("upgrades a bare host and keeps a real URL", () => {
    expect(getSafeExternalHttpUrl("example.dev")).toBe("https://example.dev/");
    expect(getSafeExternalHttpUrl("https://example.dev/blog")).toBe(
      "https://example.dev/blog",
    );
    expect(getSafeExternalHttpUrl("http://example.dev")).toBe("http://example.dev/");
  });

  it("rejects everything that is not a web address", () => {
    expect(getSafeExternalHttpUrl(null)).toBeNull();
    expect(getSafeExternalHttpUrl("   ")).toBeNull();
    expect(getSafeExternalHttpUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeExternalHttpUrl("data:text/html,<script>")).toBeNull();
    expect(getSafeExternalHttpUrl("mailto:a@example.dev")).toBeNull();
    expect(getSafeExternalHttpUrl("not a url")).toBeNull();
  });
});
