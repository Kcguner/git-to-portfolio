/**
 * Server-side locale resolution.
 *
 * Root layouts cannot read `searchParams`, so the previous implementation
 * patched `document.documentElement.lang` from a client effect and the SSR
 * HTML always shipped the default language. This module owns the pure
 * negotiation logic that Proxy uses to resolve the effective locale *before*
 * the route renders, and that Server Components use to read the result back.
 */

import { DEFAULT_LOCALE, isLocale, type Locale } from './i18n';

/**
 * Request header Proxy uses to hand the resolved locale to Server Components.
 *
 * Deliberately not `NEXT_PUBLIC_` prefixed: the value must never be inlined
 * into the client bundle. Proxy overwrites it unconditionally on every matched
 * request, so a client-supplied value can never be trusted.
 */
export const LOCALE_HEADER = 'x-site-locale';

/**
 * RFC 9110 language-range / language-tag shape. Regional subtags are allowed
 * (`en-US`, `zh-Hant-TW`) and the `*` wildcard is accepted as-is.
 */
const LANGUAGE_RANGE = /^(?:\*|[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*)$/;

/**
 * RFC 9110 qvalue. `1` may only be followed by zero digits (`1`, `1.0`,
 * `1.000`), so `1.5` is rejected as malformed.
 */
const QUALITY_VALUE = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

type LanguagePreference = {
  range: string;
  quality: number;
};

function parsePreference(entry: string): LanguagePreference | null {
  const [rawRange, ...parameters] = entry.split(';');
  const range = rawRange.trim().toLowerCase();
  if (!LANGUAGE_RANGE.test(range)) return null;

  let quality = 1;
  for (const parameter of parameters) {
    const separator = parameter.indexOf('=');
    if (separator === -1) continue;
    if (parameter.slice(0, separator).trim().toLowerCase() !== 'q') continue;

    const value = parameter.slice(separator + 1).trim();
    // An unparsable qvalue makes the whole entry unusable; dropping it is
    // safer than guessing a preference the client never expressed.
    if (!QUALITY_VALUE.test(value)) return null;
    quality = Number.parseFloat(value);
  }

  return { range, quality };
}

/**
 * RFC 4647 lookup: try the full tag, then strip trailing subtags one by one
 * (`en-US` -> `en`, `zh-Hant-TW` -> `zh-Hant` -> `zh`).
 */
function matchLanguageRange(range: string): Locale | null {
  let candidate = range;

  while (candidate) {
    if (isLocale(candidate)) return candidate;
    const separator = candidate.lastIndexOf('-');
    if (separator === -1) return null;
    candidate = candidate.slice(0, separator);
  }

  return null;
}

/**
 * Negotiates an `Accept-Language` header against the supported locales.
 *
 * Handles exact tags, regional tags, quality-weighted ordering, the `*`
 * wildcard and `q=0` exclusions. Malformed or unusable input falls back to the
 * default locale instead of throwing, because this runs on every request.
 */
export function negotiateLocaleFromAcceptLanguage(
  header: string | null | undefined,
): Locale {
  if (typeof header !== 'string') return DEFAULT_LOCALE;

  const preferences = header
    .split(',')
    .map(parsePreference)
    .filter((preference): preference is LanguagePreference => preference !== null)
    // `q=0` marks a language as explicitly unacceptable.
    .filter((preference) => preference.quality > 0)
    // Array#sort is stable, so equal q values keep their original order.
    .sort((a, b) => b.quality - a.quality);

  for (const { range } of preferences) {
    // A wildcard accepts anything, which is exactly the default locale.
    if (range === '*') return DEFAULT_LOCALE;

    const match = matchLanguageRange(range);
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}

export type LocaleRequestSignals = {
  /**
   * Every `lang` query value, or `undefined` when the request carries no
   * `lang` parameter at all.
   */
  lang?: readonly string[];
  acceptLanguage?: string | null;
};

/**
 * Resolves the effective locale for a request.
 *
 * An explicit `lang` query is authoritative: only a single supported code is
 * accepted, everything else falls back to the default. That mirrors
 * `getLocaleFromQueryValues()` on the client, which keeps the server-rendered
 * `<html lang>` and the client-side `DocumentLocale` correction in agreement.
 */
export function resolveRequestLocale({
  lang,
  acceptLanguage,
}: LocaleRequestSignals): Locale {
  if (lang !== undefined) {
    return lang.length === 1 && isLocale(lang[0]) ? lang[0] : DEFAULT_LOCALE;
  }

  return negotiateLocaleFromAcceptLanguage(acceptLanguage);
}

/**
 * Reads a locale back from the request header Proxy set. Anything unexpected
 * (missing header, spoofed value, direct render without Proxy) falls back to
 * the default locale rather than trusting unvalidated input.
 */
export function getLocaleFromHeaderValue(
  value: string | null | undefined,
): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
