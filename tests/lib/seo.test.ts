import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  getLocaleAlternates,
  getLocaleFromQueryValues,
  LOCALE_TAGS,
  withLocale,
} from '../../lib/i18n';

describe('locale-aware SEO URLs', () => {
  it('keeps the default locale on a clean URL', () => {
    expect(withLocale('/', DEFAULT_LOCALE)).toBe('/');
    expect(withLocale('/ada', DEFAULT_LOCALE, '?lang=en&tab=repos')).toBe('/ada?tab=repos');
  });

  it('removes duplicate locale values when creating a localized URL', () => {
    expect(withLocale('/ada', 'de', '?lang=en&lang=tr')).toBe('/ada?lang=de');
  });

  it('builds one hreflang target per supported locale', () => {
    expect(getLocaleAlternates('/ada')).toEqual({
      [LOCALE_TAGS.tr]: '/ada',
      [LOCALE_TAGS.en]: '/ada?lang=en',
      [LOCALE_TAGS.de]: '/ada?lang=de',
      [LOCALE_TAGS.es]: '/ada?lang=es',
      'x-default': '/ada',
    });
  });
});

describe('client locale query normalization', () => {
  it('matches the server representation for a single value', () => {
    expect(getLocaleFromQueryValues(['en'])).toBe('en');
  });

  it('keeps the safe default for repeated values on both sides', () => {
    expect(getLocaleFromQueryValues(['en', 'de'])).toBe(DEFAULT_LOCALE);
  });
});
