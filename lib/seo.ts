/**
 * Locale-aware search and social metadata.
 *
 * Everything a crawler reads about a page is derived here so the two routes
 * cannot drift apart: canonical URLs, the hreflang cluster, the social card
 * image and its alt text, keywords, and the JSON-LD graphs. The copy itself
 * lives in `lib/i18n.ts`, this module only decides *where* it goes and in what
 * shape.
 */

import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  getDictionary,
  getLocaleAlternates,
  getProfileOpenGraphImagePath,
  getProfilePathname,
  LOCALES,
  LOCALE_TAGS,
  OPEN_GRAPH_LOCALES,
  withLocale,
  type Locale,
} from "./i18n";
import { getGitHubRepoUrl, getSafeExternalHttpUrl, getSiteUrl } from "./site";
import type { TopLanguage } from "./skills";

/** Product name, used in `siteName`, structured data and social cards. */
export const SITE_NAME = "Git-to-Portfolio";

/** Intrinsic size of every generated social card, shared by all four locales. */
export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * The object form of Metadata API's `robots` field, which also accepts the
 * shorthand string `"index, follow"`.
 */
type RobotsMetadata = Exclude<NonNullable<Metadata["robots"]>, string>;

/**
 * Indexing directives for the two indexable routes.
 *
 * Kept in one place so the home page, the profile page and the sitemap cannot
 * disagree about what is crawlable, and so the opt-out of the two 404 routes is
 * visibly the exact inverse of this.
 */
export const INDEXABLE_ROBOTS: RobotsMetadata = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

/** The inverse of {@link INDEXABLE_ROBOTS}, for pages that must not be indexed. */
export const NO_INDEX_ROBOTS: RobotsMetadata = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

/**
 * Resolves a site-relative path against the canonical origin.
 *
 * `SITE_URL` may carry a base path for a deployment behind a subpath, and
 * `new URL('/x', base)` would throw that path away, so the two are joined as
 * strings first and only then parsed.
 */
export function getAbsoluteUrl(pathname: string): string {
  return new URL(`${getSiteUrl()}${pathname}`).toString();
}

/**
 * The hreflang cluster for a pathname as absolute URLs, `x-default` included.
 *
 * The sitemap protocol and the Metadata API both need absolute URLs, and the
 * locale query lives in the URL itself, so nothing here is resolvable by
 * `metadataBase` at the sitemap level.
 */
export function getAbsoluteLocaleAlternates(pathname: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getLocaleAlternates(pathname)).map(([tag, url]) => [
      tag,
      getAbsoluteUrl(url),
    ]),
  );
}

/** `canonical` plus `alternates.languages` for one localized pathname. */
export function getLocaleAlternatesMetadata(
  pathname: string,
  locale: Locale,
): { canonical: string; languages: Record<string, string> } {
  return {
    // Query strings are the only thing that can differ between two renderings
    // of the same page here, so the canonical is the localized URL itself and
    // never carries tracking or debug parameters.
    canonical: getAbsoluteUrl(withLocale(pathname, locale)),
    languages: getAbsoluteLocaleAlternates(pathname),
  };
}

/**
 * `og:locale:alternate` for every locale other than the current one.
 *
 * Facebook, LinkedIn and Slack read this to pick the card language when a page
 * is shared, so the set is derived from `LOCALES` and can never list a language
 * the site does not actually serve.
 */
export function getAlternateOpenGraphLocales(locale: Locale): string[] {
  return LOCALES.filter((candidate) => candidate !== locale).map(
    (candidate) => OPEN_GRAPH_LOCALES[candidate],
  );
}

/** The `og:locale` value for a locale. */
export function getOpenGraphLocale(locale: Locale): string {
  return OPEN_GRAPH_LOCALES[locale];
}

/** File-based social card path for the home page, one static image per locale. */
export function getHomeOpenGraphImagePath(locale: Locale): string {
  return `/opengraph-image/${locale}`;
}

/** A fully described social card, as the Metadata API accepts it. */
export type SocialImageMetadata = Array<{
  url: string;
  alt: string;
  type: string;
  width: number;
  height: number;
}>;

/**
 * Describes a social card for the Metadata API.
 *
 * The file convention would inject its own `og:image`/`twitter:image` tags, but
 * only when the route metadata does not already declare images, and it declares
 * one tag per generated image — four languages' cards on every page. Declaring
 * the image here instead keeps exactly one card, the one for this page's
 * language, with a localized `alt` and the real dimensions.
 */
export function getSocialImageMetadata(
  pathname: string,
  alt: string,
): SocialImageMetadata {
  return [
    {
      url: getAbsoluteUrl(pathname),
      alt,
      type: "image/png",
      width: SOCIAL_IMAGE_SIZE.width,
      height: SOCIAL_IMAGE_SIZE.height,
    },
  ];
}

/** The localized home page keywords. */
export function getHomeKeywords(locale: Locale): string[] {
  return getDictionary(locale).metadata.homeKeywords;
}

/** Localized keywords for one person's portfolio page. */
export function getProfileKeywords(locale: Locale, displayName: string): string[] {
  return getDictionary(locale).metadata.portfolioKeywords(displayName);
}

/**
 * Serializes a JSON-LD payload for a `<script type="application/ld+json">` tag.
 *
 * `<` is escaped as `<` so a value that contains `</script>` cannot
 * terminate the block and turn profile data (GitHub bios, repository
 * descriptions) into markup. Data blocks are not executed, so the page's
 * Content-Security-Policy does not apply to them.
 */
export function serializeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

type JsonLdNode = Record<string, unknown>;

/**
 * Site-level structured data, emitted once from the root layout.
 *
 * `WebSite` and `WebApplication` describe the product itself rather than any
 * one page, so they belong on every document in the reader's language, and
 * `inLanguage` is what tells a crawler that the Turkish, English, German and
 * Spanish documents are four editions of one site rather than four thin
 * duplicates.
 */
export function getSiteJsonLd(locale: Locale): JsonLdNode {
  const dictionary = getDictionary(locale);
  const siteUrl = getSiteUrl();
  const description = dictionary.metadata.homeDescription;
  const repoUrl = getGitHubRepoUrl();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: SITE_NAME,
        description,
        inLanguage: LOCALE_TAGS[locale],
        publisher: { "@id": `${siteUrl}/#website` },
        sameAs: [repoUrl],
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: SITE_NAME,
        description,
        url: `${siteUrl}/`,
        inLanguage: LOCALE_TAGS[locale],
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        // The service has no account, no paywall and no data collection, which
        // is the whole pitch, so it is stated as a free offer rather than left
        // for a crawler to guess.
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
    ],
  };
}

/**
 * The home page's own structured data: the visible "how it works" steps as a
 * `HowTo`.
 *
 * The steps are the exact `home.steps` strings the page renders, so the markup
 * describes content that is on the page rather than text written for crawlers.
 */
export function getHowToJsonLd(locale: Locale): JsonLdNode {
  const dictionary = getDictionary(locale);

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: dictionary.home.howTitle,
    description: dictionary.home.howDescription,
    inLanguage: LOCALE_TAGS[locale],
    step: dictionary.home.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.text,
    })),
  };
}

export type ProfileJsonLdInput = {
  locale: Locale;
  /** The profile's pathname, without any locale query. */
  pathname: string;
  /** Display name, falling back to the login when the account has no name. */
  displayName: string;
  login: string;
  description: string;
  avatarUrl: string;
  profileUrl: string;
  blogUrl: string | null;
  twitterUsername: string | null;
  repositories: {
    name: string;
    url: string;
    description: string | null;
    language: string | null;
    stars: number;
  }[];
  topLanguages: TopLanguage[];
};

/**
 * A portfolio page as a `ProfilePage` whose subject is the person, with their
 * featured repositories as `SoftwareSourceCode` and their most-used languages
 * as `knowsAbout`.
 *
 * Only facts the page itself shows are emitted: the six displayed
 * repositories and the languages derived from them. Repository descriptions
 * fall back to nothing rather than to invented text, so an absent description
 * stays absent in the markup.
 */
export function getProfileJsonLd({
  locale,
  pathname,
  displayName,
  login,
  description,
  avatarUrl,
  profileUrl,
  blogUrl,
  twitterUsername,
  repositories,
  topLanguages,
}: ProfileJsonLdInput): JsonLdNode {
  const sameAs = getProfileSameAs(profileUrl, blogUrl, twitterUsername);
  // The entity id is deliberately the locale-free URL: the four languages are
  // four renderings of one person, and giving each its own `@id` would tell a
  // knowledge graph there are four different people.
  const personId = `${getAbsoluteUrl(pathname)}#person`;
  const node: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${getAbsoluteUrl(pathname)}#webpage`,
    url: getLocaleAlternatesMetadata(pathname, locale).canonical,
    name: getDictionary(locale).metadata.portfolioTitle(displayName),
    description,
    inLanguage: LOCALE_TAGS[locale],
    image: getAbsoluteUrl(getProfileOpenGraphImagePath(login, locale)),
    // No `dateCreated`: the page shows no creation date, and the account's own
    // `created_at` would date the portfolio to the day the GitHub account was
    // opened, which is a fact about GitHub rather than about this page.
    mainEntity: {
      "@type": "Person",
      "@id": personId,
      name: displayName,
      alternateName: `@${login}`,
      description,
      image: avatarUrl,
      url: profileUrl,
      sameAs,
      // `knowsAbout` rather than `knowsLanguage`: these are programming
      // languages the featured repositories are written in, not spoken ones.
      knowsAbout: topLanguages.map((language) => language.name),
    },
  };

  if (repositories.length > 0) {
    node.hasPart = repositories.map((repository) => {
      const code: JsonLdNode = {
        "@type": "SoftwareSourceCode",
        name: repository.name,
        url: repository.url,
        codeRepository: repository.url,
        author: { "@id": personId },
        interactionStatistic: {
          "@type": "InteractionCounter",
          // Stars are likes on the repository; schema.org models that as a
          // LikeAction counter rather than a bespoke "star" type.
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: repository.stars,
        },
      };

      // Only stated when GitHub has it: an absent description or language is
      // left out rather than filled in with something invented.
      if (repository.description) code.description = repository.description;
      if (repository.language) code.programmingLanguage = repository.language;

      return code;
    });
  }

  return node;
}

/**
 * Metadata for a page that must not be indexed, with a card in the reader's
 * language.
 *
 * Both 404 segments use it. They also *have* to declare their own images: the
 * profile segment ships a metadata image route, and Next injects that route's
 * generated images into any page below it that does not name an image itself —
 * which would put four languages' cards on a page that is not indexed at all.
 */
export function getNoIndexMetadata(
  locale: Locale,
  { title, description }: { title: string; description: string },
): Metadata {
  const dictionary = getDictionary(locale);
  const images = getSocialImageMetadata(
    getHomeOpenGraphImagePath(locale),
    dictionary.metadata.ogImage.alt,
  );

  return {
    // The not-found segment is the leaf of its loader tree, so the root
    // layout's title template is not applied to it. The absolute title keeps
    // the rendered value identical to the rest of the site.
    title: { absolute: title },
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      locale: getOpenGraphLocale(locale),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    robots: { ...NO_INDEX_ROBOTS },
  };
}

/** A person's external profile links, normalized the same way the UI does. */
export function getProfileSameAs(
  profileUrl: string,
  blog: string | null,
  twitterUsername: string | null,
): string[] {
  return [
    profileUrl,
    getSafeExternalHttpUrl(blog),
    twitterUsername ? `https://x.com/${twitterUsername}` : null,
  ].filter((url): url is string => Boolean(url));
}

/** The pathname of a profile page, re-exported so routes build URLs in one place. */
export { getProfileOpenGraphImagePath, getProfilePathname };

/**
 * The locale a metadata image route was asked for, from the path segment
 * `generateImageMetadata` generated. An unknown or missing id falls back to the
 * default locale rather than throwing, so a stale or hand-typed image URL still
 * renders a card instead of a 500.
 */
export function getLocaleFromImageId(
  id: string | number | null | undefined,
): Locale {
  const value = typeof id === "string" || typeof id === "number" ? String(id) : "";
  return LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE;
}
