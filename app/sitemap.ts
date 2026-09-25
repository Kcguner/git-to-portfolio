import type { MetadataRoute } from "next";
import { getLocaleAlternates } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site";

const PROFILE_USERNAMES = ["torvalds", "gaearon", "yyx990803"] as const;

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
  siteUrl: string,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>,
  priority: number
): MetadataRoute.Sitemap[number] {
  // getLocaleAlternates() returns relative hreflang targets for one pathname;
  // the sitemap protocol requires absolute URLs, so resolve them against the site origin.
  const languages = Object.fromEntries(
    Object.entries(getLocaleAlternates(pathname)).map(([tag, url]) => [tag, `${siteUrl}${url}`])
  );

  return {
    url: `${siteUrl}${pathname}`,
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    buildEntry("/", siteUrl, "weekly", 1),
    ...PROFILE_USERNAMES.map((username) =>
      buildEntry(`/${encodeURIComponent(username)}`, siteUrl, "weekly", 0.8)
    ),
  ];
}
