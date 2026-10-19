import type { Locale } from './types';

/**
 * Single source of truth for the version advertised in the UI badge. It mirrors
 * `package.json#version` and is asserted against it by `tests/lib/i18n.test.ts`
 * rather than imported, because importing package.json would pull the whole
 * manifest into the client bundle.
 */
export const APP_VERSION = '0.1.0';

export const LOCALES = ['tr', 'en', 'de', 'es'] as const satisfies readonly Locale[];

export const DEFAULT_LOCALE: Locale = 'tr';

export const LOCALE_LABELS: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
};

export const LOCALE_TAGS: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
};

export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  tr: 'tr_TR',
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale);
}

/**
 * The query string shapes `withLocale()` accepts.
 *
 * A plain record is the shape Next.js used to hand to a page as
 * `searchParams`; a string and a `URLSearchParams` are what a router or a
 * `Link` carries around. All three are accepted so a caller never has to
 * normalize them first.
 */
export type LocaleSearchInput =
  | string
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

/**
 * Reads the locale out of a URL path segment.
 *
 * This is a **validated** fallback, not a silent one: the value it returns is
 * either one of the four supported locales or the default locale, and it
 * never rejects anything. A caller that has to *refuse* a segment the site
 * does not serve — a route that answers an unknown language with a 404 —
 * checks `isLocale()` itself instead of reading the answer out of this
 * function, so an unsupported segment never turns into a page in the default
 * language under a foreign URL.
 */
export function getLocaleFromSegment(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * The base path of a profile: the username path without a locale segment.
 *
 * `/octocat` is the page; `/tr/octocat`, `/en/octocat` and the rest are the
 * four addresses it is published under. The username is percent-encoded here
 * for the same reason `getProfilePathname()` encodes it, so every caller
 * derives the same URL from the same login.
 */
export function getProfileBasePathname(username: string): string {
  return `/${encodeURIComponent(username)}`;
}

/**
 * Returns the canonical pathname of a profile.
 *
 * The username is percent-encoded here so every caller — links, canonicals,
 * hreflang sets, the sitemap and the metadata image path — derives the same
 * URL from the same login.
 *
 * The locale is part of the path now and is therefore **required**: a
 * profile URL without a language prefix does not exist any more, and a missing
 * locale has to be a loud bug rather than a silent Turkish fallback. The
 * returned path is `/<locale>/<username>`.
 */
export function getProfilePathname(username: string, locale: Locale): string {
  return `/${locale}${getProfileBasePathname(username)}`;
}

function toSearchParams(search: LocaleSearchInput): URLSearchParams {
  if (search instanceof URLSearchParams) return new URLSearchParams(search);
  if (typeof search === 'string') return new URLSearchParams(search);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

/**
 * Splits a hash off a search string.
 *
 * A search string that still carries its own fragment (`?tab=repos#repos`) has
 * to be split before it becomes a `URLSearchParams`, otherwise the `#` would
 * be percent-encoded into the query value instead of ending the URL.
 */
function splitHash(search: LocaleSearchInput): { source: LocaleSearchInput; hash: string } {
  if (typeof search !== 'string') return { source: search, hash: '' };

  const separator = search.indexOf('#');
  if (separator === -1) return { source: search, hash: '' };

  return { source: search.slice(0, separator), hash: search.slice(separator) };
}

/**
 * Removes a leading locale segment from a **full** pathname.
 *
 * `withLocale()` rewrites the *first* segment, so it has to know whether that
 * segment is a locale or the start of the page's own path. `/en/torvalds` and
 * `/torvalds` are the same page in two languages, and only the first one
 * carries the prefix.
 *
 * This is the rule for a full path, where a lone locale segment is that
 * locale's home (`/en` is the English home). The **base** path of a page —
 * the path without a language — follows a stricter rule, see
 * `getBasePathname()`.
 */
function stripLocalePrefix(pathname: string): string {
  const withoutLeadingSlash = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  if (withoutLeadingSlash === '') return '/';

  const segments = withoutLeadingSlash.split('/');
  if (isLocale(segments[0])) segments.shift();
  if (segments.length === 0) return '/';

  const base = `/${segments.join('/')}`;
  return base.length > 1 ? base.replace(/\/+$/, '') : base;
}

/** Makes sure a hash is either empty or starts with its `#`. */
function normalizeHash(hash: string): string {
  if (hash === '') return '';
  return hash.startsWith('#') ? hash : `#${hash}`;
}

/**
 * Rewrites a pathname so that it carries `locale` as its first path segment.
 *
 * The locale lives in the path, so this is the one function every link in the
 * app goes through:
 *
 * - an existing locale segment is **replaced**, never stacked on top of;
 * - the query string is kept as it is, except for the legacy `lang` key,
 *   which is dropped because the path already says which language this is;
 * - the hash is kept.
 *
 * The input is a **full** path: one that may already carry a locale segment,
 * which is what the language switcher passes it (the current address). A lone
 * locale segment is that locale's home, so `/en` becomes `/de`.
 *
 * The **base** path of a page — the path without a language — is a different
 * thing and has its own builder, `withBaseLocale()`: a base path is prefixed,
 * never rewritten, so the account called `en` stays the account called `en`.
 *
 * The truth table:
 *
 * | input | output |
 * | --- | --- |
 * | `withLocale('/torvalds', 'en')` | `/en/torvalds` |
 * | `withLocale('/en/torvalds', 'de')` | `/de/torvalds` |
 * | `withLocale('/', 'tr')` | `/tr` |
 * | `withLocale('/en', 'de')` | `/de` |
 * | `withLocale('/torvalds', 'en', '?tab=repos#x')` | `/en/torvalds?tab=repos#x` |
 * | `withLocale('/torvalds', 'de', '?lang=tr&tab=repos&tag=nextjs')` | `/de/torvalds?tab=repos&tag=nextjs` |
 * | `withLocale('/tr/torvalds', 'es', { tab: 'repos' })` | `/es/torvalds?tab=repos` |
 */
export function withLocale(
  pathname: string,
  locale: Locale,
  search: LocaleSearchInput = '',
  hash = '',
): string {
  const { source, hash: inlineHash } = splitHash(search);
  const params = toSearchParams(source);

  // `?lang=` is the legacy way of asking for a language. The path carries the
  // locale now, so the key is removed instead of being carried along and
  // contradicting the segment in front of it.
  params.delete('lang');

  const base = stripLocalePrefix(pathname);
  const suffix = normalizeHash(hash || inlineHash);
  const query = params.toString();

  return `/${locale}${base === '/' ? '' : base}${query ? `?${query}` : ''}${suffix}`;
}

/**
 * Returns the metadata image path for a profile.
 *
 * The locale is the *image route's* path segment rather than a page query
 * parameter, because social crawlers fetch the image URL on its own and may
 * omit the page's query string. That also keeps every language's card a
 * separate, separately cacheable URL instead of one shared response that would
 * have to be re-rendered per request.
 */
export function getProfileOpenGraphImagePath(username: string, locale: Locale): string {
  return `${getProfilePathname(username, locale)}/opengraph-image/${locale}`;
}

/**
 * The base path of a page: its pathname without a locale segment.
 *
 * The locale lives in the path, so a page has two forms: the **base** path
 * (`/torvalds`, `/`) and the **localized** path (`/en/torvalds`, `/en`). The
 * URL builders work from the base path, and this function turns either form
 * into it.
 *
 * A locale segment is stripped **once**, and only when something follows it:
 *
 * | input | base path |
 * | --- | --- |
 * | `/` | `/` |
 * | `/torvalds` | `/torvalds` |
 * | `/en/torvalds` | `/torvalds` |
 * | `/en` | `/en` |
 *
 * The last row is the one that matters: `/en` is the base path of the GitHub
 * account called `en`, not the English home. A segment is only a locale when
 * the page's own path is behind it, so a username that happens to be called
 * `en` is never mistaken for one.
 */
export function getBasePathname(pathname: string): string {
  const withoutLeadingSlash = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  if (withoutLeadingSlash === '') return '/';

  const segments = withoutLeadingSlash.split('/');
  // A lone segment is the page's own — the account `en` — and not a locale.
  if (segments.length > 1 && isLocale(segments[0])) segments.shift();
  if (segments.length === 0) return '/';

  const base = `/${segments.join('/')}`;
  return base.length > 1 ? base.replace(/\/+$/, '') : base;
}

/**
 * Puts a locale in front of a **base** path.
 *
 * The base path is never inspected: the locale is simply put in front of it.
 * That is what keeps a username that happens to be called `en` from being
 * mistaken for a locale — the path is the page's own, and the locale is
 * added to it rather than replacing its first segment.
 *
 * `withLocale()` is the other half: it takes a **full** path and *replaces*
 * the locale segment that is already in it.
 */
export function withBaseLocale(basePathname: string, locale: Locale): string {
  const base = basePathname === '/' ? '' : basePathname;
  return `/${locale}${base}`;
}

/**
 * Returns the hreflang targets for a page.
 *
 * `pathname` is the **base** path of the page, without a locale segment:
 * `/torvalds` or `/`. The helper adds the prefix itself.
 *
 * A path that already carries a locale segment is accepted as well and the
 * segment is removed exactly once, so `/en/torvalds` and `/torvalds` are the
 * same page and neither of them can end up as `/en/en/torvalds`.
 *
 * The truth table:
 *
 * | input | `tr-TR` | `en-US` | `de-DE` | `es-ES` | `x-default` |
 * | --- | --- | --- | --- | --- | --- |
 * | `/` | `/tr` | `/en` | `/de` | `/es` | `/tr` |
 * | `/torvalds` | `/tr/torvalds` | `/en/torvalds` | `/de/torvalds` | `/es/torvalds` | `/tr/torvalds` |
 * | `/en` (the account `en`) | `/tr/en` | `/en/en` | `/de/en` | `/es/en` | `/tr/en` |
 * | `/en/torvalds` | `/tr/torvalds` | `/en/torvalds` | `/de/torvalds` | `/es/torvalds` | `/tr/torvalds` |
 *
 * Values are relative so callers can either resolve them with Metadata API's
 * metadataBase or make them absolute themselves.
 */
export function getLocaleAlternates(pathname: string): Record<string, string> {
  const base = getBasePathname(pathname);

  return {
    ...Object.fromEntries(
      LOCALES.map((locale) => [LOCALE_TAGS[locale], withBaseLocale(base, locale)])
    ),
    'x-default': withBaseLocale(base, DEFAULT_LOCALE),
  };
}
