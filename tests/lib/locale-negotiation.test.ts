import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, LOCALES } from '../../lib/i18n';
import {
  negotiateLocaleFromAcceptLanguage,
  readLocaleCookie,
  resolveRequestLocale,
  SITE_LOCALE_COOKIE,
} from '../../lib/locale-negotiation';

describe('locale cookie contract', () => {
  it('names the cookie the proxy writes', () => {
    expect(SITE_LOCALE_COOKIE).toBe('site-locale');
  });

  it('reads only supported locales back', () => {
    expect(readLocaleCookie('de')).toBe('de');
    for (const locale of LOCALES) {
      expect(readLocaleCookie(locale)).toBe(locale);
    }
  });

  it('returns null for an absent or unusable value', () => {
    expect(readLocaleCookie(undefined)).toBeNull();
    expect(readLocaleCookie(null)).toBeNull();
    expect(readLocaleCookie('')).toBeNull();
    expect(readLocaleCookie('   ')).toBeNull();
    expect(readLocaleCookie('EN')).toBeNull();
    expect(readLocaleCookie('fr')).toBeNull();
    expect(readLocaleCookie('en; charset=utf-8')).toBeNull();
  });
});

describe('Accept-Language negotiation', () => {
  it('matches an exact language tag', () => {
    expect(negotiateLocaleFromAcceptLanguage('de')).toBe('de');
    expect(negotiateLocaleFromAcceptLanguage('es')).toBe('es');
  });

  it('is case insensitive', () => {
    expect(negotiateLocaleFromAcceptLanguage('DE-de')).toBe('de');
    expect(negotiateLocaleFromAcceptLanguage('EN-US')).toBe('en');
  });

  it('falls back from a regional tag to its base language', () => {
    expect(negotiateLocaleFromAcceptLanguage('en-US')).toBe('en');
    expect(negotiateLocaleFromAcceptLanguage('en-GB')).toBe('en');
    expect(negotiateLocaleFromAcceptLanguage('es-MX')).toBe('es');
    expect(negotiateLocaleFromAcceptLanguage('tr-TR')).toBe('tr');
  });

  it('strips one subtag at a time for script and variant tags', () => {
    expect(negotiateLocaleFromAcceptLanguage('de-Latn-DE')).toBe('de');
    expect(negotiateLocaleFromAcceptLanguage('es-419')).toBe('es');
  });

  it('orders the list by quality, not by position', () => {
    expect(negotiateLocaleFromAcceptLanguage('tr;q=0.2,de;q=0.9')).toBe('de');
    expect(negotiateLocaleFromAcceptLanguage('tr;q=1.0,es;q=0.8,en;q=0.9')).toBe('tr');
  });

  it('keeps the original order for equal quality values', () => {
    expect(negotiateLocaleFromAcceptLanguage('es;q=0.7,de;q=0.7')).toBe('es');
    expect(negotiateLocaleFromAcceptLanguage('es, de')).toBe('es');
  });

  it('skips unsupported languages and keeps looking', () => {
    expect(negotiateLocaleFromAcceptLanguage('fr-FR,de;q=0.8')).toBe('de');
    expect(negotiateLocaleFromAcceptLanguage('ja,zh-Hant-TW,es;q=0.5')).toBe('es');
  });

  it('treats the wildcard as the default locale', () => {
    expect(negotiateLocaleFromAcceptLanguage('*')).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage('fr, *;q=0.1')).toBe(DEFAULT_LOCALE);
  });

  it('lets a higher quality range win over an earlier wildcard', () => {
    expect(negotiateLocaleFromAcceptLanguage('*;q=0.1,es;q=0.9')).toBe('es');
  });

  it('honours q=0 exclusions', () => {
    expect(negotiateLocaleFromAcceptLanguage('en;q=0,de')).toBe('de');
    expect(negotiateLocaleFromAcceptLanguage('tr;q=0,en-US;q=0.5')).toBe('en');
    expect(negotiateLocaleFromAcceptLanguage('*;q=0')).toBe(DEFAULT_LOCALE);
  });

  it('ignores whitespace around ranges and parameters', () => {
    expect(negotiateLocaleFromAcceptLanguage(' de-DE , en-US ; q=0.4 ')).toBe('de');
  });

  it('ignores parameters other than q', () => {
    expect(negotiateLocaleFromAcceptLanguage('en-US;foo=bar')).toBe('en');
  });

  it('defaults to tr for unusable input', () => {
    expect(negotiateLocaleFromAcceptLanguage('')).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage('   ')).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage(null)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage(undefined)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage('garbage')).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage('!!!')).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage('1234')).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage('toolongsubtagvalue')).toBe(
      DEFAULT_LOCALE
    );
    expect(negotiateLocaleFromAcceptLanguage('en;q=abc')).toBe(DEFAULT_LOCALE);
    expect(negotiateLocaleFromAcceptLanguage('en;q=1.5')).toBe(DEFAULT_LOCALE);
  });

  it('accepts the whole supported set', () => {
    for (const locale of LOCALES) {
      expect(negotiateLocaleFromAcceptLanguage(locale)).toBe(locale);
    }
  });
});

describe('request locale resolution', () => {
  it('prefers the remembered cookie over Accept-Language', () => {
    // The cookie is an explicit choice, and an explicit choice outranks the
    // browser's default.
    expect(resolveRequestLocale({ cookie: 'en', acceptLanguage: 'de-DE,de;q=0.9' })).toBe(
      'en'
    );
  });

  it('negotiates from Accept-Language when there is no cookie', () => {
    expect(resolveRequestLocale({ acceptLanguage: 'de-DE,de;q=0.9,en;q=0.8' })).toBe(
      'de'
    );
  });

  it('ignores an unusable cookie and negotiates instead', () => {
    expect(resolveRequestLocale({ cookie: 'fr', acceptLanguage: 'de' })).toBe('de');
    expect(resolveRequestLocale({ cookie: '', acceptLanguage: 'de' })).toBe('de');
  });

  it('falls back to the default when neither signal is usable', () => {
    expect(resolveRequestLocale({ acceptLanguage: 'fr-FR' })).toBe(DEFAULT_LOCALE);
    expect(resolveRequestLocale({})).toBe(DEFAULT_LOCALE);
    expect(resolveRequestLocale({ cookie: 'fr', acceptLanguage: 'fr-FR' })).toBe(
      DEFAULT_LOCALE
    );
  });

  it('treats the default locale as an explicit choice', () => {
    expect(resolveRequestLocale({ cookie: 'tr', acceptLanguage: 'de' })).toBe('tr');
  });
});
