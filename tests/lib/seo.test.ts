import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  getDictionary,
  getLocaleAlternates,
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
  SITE_AUTHOR,
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
  it("puts the locale in the path, for every locale", () => {
    expect(withLocale("/", DEFAULT_LOCALE)).toBe("/tr");
    expect(withLocale("/ada", DEFAULT_LOCALE, "?lang=en&tab=repos")).toBe(
      "/tr/ada?tab=repos",
    );
    expect(withLocale("/ada", "de")).toBe("/de/ada");
  });

  it("drops the legacy lang query instead of carrying both forms", () => {
    expect(withLocale("/ada", "de", "?lang=en&lang=tr")).toBe("/de/ada");
  });

  it("builds one hreflang target per supported locale", () => {
    expect(getLocaleAlternates("/ada")).toEqual({
      [LOCALE_TAGS.tr]: "/tr/ada",
      [LOCALE_TAGS.en]: "/en/ada",
      [LOCALE_TAGS.de]: "/de/ada",
      [LOCALE_TAGS.es]: "/es/ada",
      "x-default": "/tr/ada",
    });
  });
});

describe("localized URLs", () => {
  it("keeps a base path from SITE_URL instead of resolving against the origin", () => {
    // `new URL('/x', base)` would drop the subpath, which would break every
    // canonical, hreflang and image URL on a deployment behind one.
    expect(getAbsoluteUrl("/de/octocat")).toBe(
      "https://seo.example.test/portfolio/de/octocat",
    );
    expect(getAbsoluteLocaleAlternates("/octocat")).toEqual({
      "tr-TR": "https://seo.example.test/portfolio/tr/octocat",
      "en-US": "https://seo.example.test/portfolio/en/octocat",
      "de-DE": "https://seo.example.test/portfolio/de/octocat",
      "es-ES": "https://seo.example.test/portfolio/es/octocat",
      "x-default": "https://seo.example.test/portfolio/tr/octocat",
    });
  });

  it("points the canonical at the page's own language", () => {
    expect(getLocaleAlternatesMetadata("/", "tr").canonical).toBe(
      "https://seo.example.test/portfolio/tr",
    );
    expect(getLocaleAlternatesMetadata("/", "es").canonical).toBe(
      "https://seo.example.test/portfolio/es",
    );
    expect(getLocaleAlternatesMetadata("/octocat", "de").canonical).toBe(
      "https://seo.example.test/portfolio/de/octocat",
    );
    // The cluster is identical whichever language asks for it.
    expect(getLocaleAlternatesMetadata("/", "es").languages).toEqual(
      getLocaleAlternatesMetadata("/", "tr").languages,
    );
  });

  it("keeps the account called `en` off the language homes", () => {
    // The GitHub account `en` exists. Its base path is `/en`, and its four
    // published addresses are `/tr/en`, `/en/en`, `/de/en` and `/es/en` — the
    // locale is added in front of the base path, never substituted into it.
    expect(getLocaleAlternatesMetadata("/en", "tr").canonical).toBe(
      "https://seo.example.test/portfolio/tr/en",
    );
    expect(getLocaleAlternatesMetadata("/en", "en").canonical).toBe(
      "https://seo.example.test/portfolio/en/en",
    );
    expect(getLocaleAlternatesMetadata("/en", "de").canonical).toBe(
      "https://seo.example.test/portfolio/de/en",
    );
    expect(getLocaleAlternatesMetadata("/en", "es").canonical).toBe(
      "https://seo.example.test/portfolio/es/en",
    );

    // The cluster says the same thing, and its `x-default` is the Turkish
    // address of that account, not the Turkish home.
    expect(getLocaleAlternatesMetadata("/en", "tr").languages).toEqual({
      "tr-TR": "https://seo.example.test/portfolio/tr/en",
      "en-US": "https://seo.example.test/portfolio/en/en",
      "de-DE": "https://seo.example.test/portfolio/de/en",
      "es-ES": "https://seo.example.test/portfolio/es/en",
      "x-default": "https://seo.example.test/portfolio/tr/en",
    });
  });

  it("builds one social card URL per language, addressed by path", () => {
    expect(LOCALES.map(getHomeOpenGraphImagePath)).toEqual([
      "/tr/opengraph-image/tr",
      "/en/opengraph-image/en",
      "/de/opengraph-image/de",
      "/es/opengraph-image/es",
    ]);
    expect(getProfilePathname("octo cat", "es")).toBe("/es/octo%20cat");
    expect(getProfileOpenGraphImagePath("octocat", "es")).toBe(
      "/es/octocat/opengraph-image/es",
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
    expect(getSocialImageMetadata("/de/opengraph-image/de", "Kartenalt")).toEqual([
      {
        url: "https://seo.example.test/portfolio/de/opengraph-image/de",
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
        // The site itself lives under the locale's own path.
        expect(node.url).toBe(`https://seo.example.test/portfolio/${locale}`);
      }
    }
  });

  it("names an author and reuses the visible steps as the feature list", () => {
    for (const locale of LOCALES) {
      const graph = (getSiteJsonLd(locale)["@graph"] ?? []) as Array<Record<string, unknown>>;
      const app = graph.find((node) => node["@type"] === "WebApplication") as Record<
        string,
        unknown
      >;

      // An unattributed deployment on a shared subdomain is the one thing a
      // search engine has least reason to trust, so the author is named.
      expect(app.creator).toEqual({
        "@type": "Person",
        name: SITE_AUTHOR,
        url: "https://github.com/Kcguner/git-to-portfolio",
      });
      // The feature list is the steps the page renders, not a separate one.
      expect(app.featureList).toEqual(
        getDictionary(locale).home.steps.map((step) => step.title),
      );
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
      image: string;
      mainEntity: { '@id': string; knowsAbout: string[] };
      hasPart: Array<Record<string, unknown>>;
    };

    // The page URL carries the language; the entity id does not, so the four
    // languages describe one person.
    expect(node.url).toBe("https://seo.example.test/portfolio/de/octocat");
    expect(node.inLanguage).toBe("de-DE");
    expect(node.image).toBe(
      "https://seo.example.test/portfolio/de/octocat/opengraph-image/de",
    );
    expect(node['@id']).toBe("https://seo.example.test/portfolio/tr/octocat#webpage");
    expect(node.mainEntity['@id']).toBe(
      "https://seo.example.test/portfolio/tr/octocat#person",
    );
    expect(node.mainEntity.knowsAbout).toEqual(["TypeScript"]);
    expect(node.hasPart).toHaveLength(1);
    expect(node.hasPart[0]).toMatchObject({
      '@type': "SoftwareSourceCode",
      codeRepository: "https://github.com/octocat/repo-1",
      author: { '@id': "https://seo.example.test/portfolio/tr/octocat#person" },
      interactionStatistic: {
        '@type': "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: 12,
      },
    });
  });

  it("gives the person one stable identity across all four languages", () => {
    const personIds = new Set<string>();
    const pageIds = new Set<string>();

    for (const locale of LOCALES) {
      const node = getProfileJsonLd({ ...PROFILE, locale }) as Record<string, never> & {
        '@id': string;
        url: string;
        mainEntity: { '@id': string };
      };

      // The default locale's URL is the stable address of the person, because
      // there is no locale-free URL left to hang the id on.
      expect(node.mainEntity['@id']).toBe(
        "https://seo.example.test/portfolio/tr/octocat#person",
      );
      expect(node['@id']).toBe("https://seo.example.test/portfolio/tr/octocat#webpage");
      // The page URL, on the other hand, is the language that was asked for.
      expect(node.url).toBe(`https://seo.example.test/portfolio/${locale}/octocat`);

      personIds.add(node.mainEntity['@id']);
      pageIds.add(node['@id']);
    }

    expect(personIds.size).toBe(1);
    expect(pageIds.size).toBe(1);
  });

  it("describes the account called `en` as itself, not as the English home", () => {
    const node = getProfileJsonLd({
      ...PROFILE,
      locale: "de",
      pathname: "/en",
      login: "en",
      displayName: "The Account Called En",
    }) as Record<string, never> & {
      '@id': string;
      url: string;
      image: string;
      mainEntity: { '@id': string };
    };

    // The page URL is the German address of that account, not the German
    // home: the locale goes in front of the base path, it does not replace it.
    expect(node.url).toBe("https://seo.example.test/portfolio/de/en");
    expect(node.image).toBe(
      "https://seo.example.test/portfolio/de/en/opengraph-image/de",
    );
    // The identity of the account is stable in the default locale.
    expect(node['@id']).toBe("https://seo.example.test/portfolio/tr/en#webpage");
    expect(node.mainEntity['@id']).toBe(
      "https://seo.example.test/portfolio/tr/en#person",
    );
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
