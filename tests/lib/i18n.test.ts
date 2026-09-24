import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  dictionaries,
  getDictionary,
  getLocale,
  isLocale,
  LOCALE_LABELS,
  LOCALE_TAGS,
  LOCALES,
  OPEN_GRAPH_LOCALES,
  withLocale,
} from '../../lib/i18n';

describe('getLocale', () => {
  it.each(LOCALES)('accepts the supported %s locale', (locale) => {
    expect(getLocale({ lang: locale })).toBe(locale);
  });

  it('defaults safely when the language is missing', () => {
    expect(getLocale({})).toBe(DEFAULT_LOCALE);
    expect(getLocale(undefined)).toBe('tr');
    expect(getLocale(null)).toBe('tr');
  });

  it.each(['fr', 'EN', '', 'en-US'])('falls back for an unsupported value: %s', (value) => {
    expect(getLocale({ lang: value })).toBe('tr');
  });

  it('falls back when a query key has multiple values', () => {
    expect(getLocale({ lang: ['en', 'de'] })).toBe('tr');
  });
});

describe('withLocale', () => {
  it('adds a non-default locale to a pathname', () => {
    expect(withLocale('/torvalds', 'en')).toBe('/torvalds?lang=en');
    expect(withLocale('/torvalds', 'tr')).toBe('/torvalds');
  });

  it('replaces an old locale and preserves other query values and the hash', () => {
    expect(
      withLocale('/torvalds', 'de', '?lang=tr&tab=repos&tag=nextjs', '#projects'),
    ).toBe('/torvalds?tab=repos&tag=nextjs&lang=de#projects');
  });

  it('serializes object query values, including repeated keys', () => {
    expect(
      withLocale('/', 'es', { view: ['compact', 'print'], tab: 'repos', empty: undefined }),
    ).toBe('/?view=compact&view=print&tab=repos&lang=es');
  });
});

describe('locale exports', () => {
  it('exports the four supported locales and default', () => {
    expect(LOCALES).toEqual(['tr', 'en', 'de', 'es']);
    expect(DEFAULT_LOCALE).toBe('tr');
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });

  it('exports labels and locale tags for every locale', () => {
    for (const locale of LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
      expect(LOCALE_TAGS[locale]).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(OPEN_GRAPH_LOCALES[locale]).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
  });
});

describe('dictionaries', () => {
  it('contains complete dictionary entries for all four languages', () => {
    expect(Object.keys(dictionaries)).toEqual(['tr', 'en', 'de', 'es']);

    for (const locale of LOCALES) {
      const dictionary = getDictionary(locale);
      expect(dictionary).toBe(dictionaries[locale]);
      expect(dictionary.localeSwitcher.label).toBeTruthy();
      expect(dictionary.search.inputLabel).toBeTruthy();
      expect(dictionary.home.steps).toHaveLength(3);
      expect(dictionary.home.exampleDescriptions.torvalds).toBeTruthy();
      expect(dictionary.print.label).toBeTruthy();
      expect(dictionary.metadata.portfolioTitle('Ada')).toContain('Ada');
    }
  });
});
