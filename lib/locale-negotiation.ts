/**
 * Locale negotiation for the bare site root.
 *
 * The locale is a path segment now: every localized URL is
 * `/<locale>/...`, and the four languages are four separate, separately
 * cacheable pages instead of one request-bound rendering. That leaves exactly
 * one URL that cannot name a language on its own — the bare `/` — and this
 * module owns what happens to it.
 *
 * The Proxy negotiates that one URL from the visitor's `Accept-Language`
 * header and their `site-locale` cookie, redirects to `/<locale>`, and
 * remembers the choice in the cookie. Every other URL already says which
 * language it is, so it is served without any negotiation at all.
 */

import { DEFAULT_LOCALE, isLocale } from './i18n/consts';
import type { Locale } from './i18n/types';

/**
 * The name of the cookie the visitor's language choice is kept in.
 *
 * It is a preference, not a secret: the Proxy reads it to answer the bare
 * root, and the language switcher writes it from the browser when the
 * visitor picks a language. Nothing about it is sensitive, and it is not an
 * environment value — it is a plain constant that both sides import.
 */
export const SITE_LOCALE_COOKIE = 'site-locale';

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

/**
 * Reads a locale out of the `site-locale` cookie.
 *
 * The cookie is written by the Proxy from a value the site itself produced,
 * but it still comes from the client, so it is treated as untrusted input: a
 * missing, empty or unsupported value yields `null` instead of a locale, and
 * the caller falls back to negotiation. `null` and `undefined` are both
 * "absent".
 */
export function readLocaleCookie(value: string | null | undefined): Locale | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (trimmed === '') return null;

  return isLocale(trimmed) ? trimmed : null;
}

export type LocaleRequestSignals = {
  /** The raw `Accept-Language` request header, if the request carried one. */
  acceptLanguage?: string | null;
  /** The raw `site-locale` cookie value, if the request carried one. */
  cookie?: string | null;
};

/**
 * Resolves the effective locale for the bare `/`.
 *
 * The cookie wins over `Accept-Language`: it is the language the visitor
 * explicitly chose (by switching languages, or by the Proxy remembering the
 * language it redirected them to), and an explicit choice outranks the
 * browser's default. A cookie that is missing or unusable is ignored and the
 * header decides; if neither signal is usable, the default locale does.
 */
export function resolveRequestLocale({
  acceptLanguage,
  cookie,
}: LocaleRequestSignals): Locale {
  const remembered = readLocaleCookie(cookie);
  if (remembered) return remembered;

  return negotiateLocaleFromAcceptLanguage(acceptLanguage);
}
