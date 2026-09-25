import type { MetadataRoute } from "next";
import { getProfilePathname, LOCALES, withLocale, type Locale } from "@/lib/i18n";
import { getAbsoluteLocaleAlternates } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

/**
 * Profile pages submitted for indexing. This is deliberately its own list
 * rather than a projection of `EXAMPLES`: the example grid is a UI decision
 * about what to showcase, the sitemap is about what we want crawled, and
 * coupling them would mean a layout change silently dropping a page from
 * search. The owner's profile leads it; the others stay for long-tail
 * discovery even though they are no longer showcased on the home page.
 */
const PROFILE_USERNAMES = ["kcguner", "torvalds", "gaearon", "yyx990803"] as const;

/**
 * `lastmod` is intentionally omitted. Every page in this sitemap is rendered from
 * live GitHub data at request time, so there is no per-URL modification date the
 * build can honestly know. Emitting `new Date()` would stamp every URL with the
 * deploy time on every release, which is not a real lastmod and teaches crawlers
 * to ignore the field. Omitting it is valid per the sitemaps.org protocol: the
 * element is optional and `changefreq`/`priority` still carry the crawl hints.
 */
function buildEntry(
  pathname: string,
  locale: Locale,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>,
  priority: number
): MetadataRoute.Sitemap[number] {
  return {
    // Every language is its own URL, not one URL plus a query parameter that
    // crawlers have to guess is a translation. Each entry repeats the full
    // hreflang cluster, which is what the protocol asks for: a localized URL
    // that is only reachable through another URL's alternates is discovered
    // late, if at all.
    url: `${getSiteUrl()}${withLocale(pathname, locale)}`,
    changeFrequency,
    priority,
    alternates: { languages: getAbsoluteLocaleAlternates(pathname) },
  };
}

/** One sitemap entry per language for one pathname. */
function buildLocaleEntries(
  pathname: string,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>,
  priority: number
): MetadataRoute.Sitemap[number][] {
  return LOCALES.map((locale) => buildEntry(pathname, locale, changeFrequency, priority));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // The home page is the strongest signal for the site, so every language
    // keeps the top priority; the profiles share the lower one.
    ...buildLocaleEntries("/", "weekly", 1),
    ...PROFILE_USERNAMES.flatMap((username) =>
      buildLocaleEntries(getProfilePathname(username), "weekly", 0.8)
    ),
  ];
}
