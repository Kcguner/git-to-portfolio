import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../../lib/examples';
import {
  APP_VERSION,
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

// Vitest runs from the project root, and the jsdom environment rewrites
// import.meta.url to an http URL, so the manifest is resolved from the cwd.
const packageJsonVersion = (
  JSON.parse(
    readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
  ) as { version: string }
).version;

type Inspection = { blankStringPaths: string[]; stringCount: number };

/**
 * Walks a dictionary recursively and reports every string value that is empty
 * or whitespace only, so a blank UI string can never reach a locale.
 */
function inspectDictionary(value: unknown, path = ''): Inspection {
  if (typeof value === 'string') {
    return { blankStringPaths: value.trim() === '' ? [path] : [], stringCount: 1 };
  }

  if (Array.isArray(value)) {
    return value.reduce<Inspection>(
      (accumulator, item, index) => mergeInspection(accumulator, inspectDictionary(item, `${path}[${index}]`)),
      { blankStringPaths: [], stringCount: 0 }
    );
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce<Inspection>(
      (accumulator, [key, nested]) =>
        mergeInspection(accumulator, inspectDictionary(nested, path ? `${path}.${key}` : key)),
      { blankStringPaths: [], stringCount: 0 }
    );
  }

  return { blankStringPaths: [], stringCount: 0 };
}

function mergeInspection(
  left: { blankStringPaths: string[]; stringCount: number },
  right: Inspection
): Inspection {
  return {
    blankStringPaths: [...left.blankStringPaths, ...right.blankStringPaths],
    stringCount: left.stringCount + right.stringCount,
  };
}

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
      expect(dictionary.print.label).toBeTruthy();
      expect(dictionary.metadata.portfolioTitle('Ada')).toContain('Ada');
    }
  });

  it('resolves an example description for every example in every locale', () => {
    const descriptionKeys = EXAMPLES.map((example) => example.descriptionKey);
    expect(descriptionKeys).toHaveLength(EXAMPLES.length);
    expect(new Set(descriptionKeys).size).toBe(descriptionKeys.length);

    for (const locale of LOCALES) {
      const { exampleDescriptions } = getDictionary(locale).home;

      for (const example of EXAMPLES) {
        const description = exampleDescriptions[example.descriptionKey];
        expect(typeof description).toBe('string');
        expect(description).toBe(description.trim());
        expect(description.length).toBeGreaterThan(0);
      }

      // Stale keys silently ship as unused data, so the dictionary must not
      // carry entries for examples that no longer exist.
      expect(Object.keys(exampleDescriptions).sort()).toEqual([...descriptionKeys].sort());
    }
  });

  it('actually translates the example descriptions instead of copying one locale', () => {
    for (const example of EXAMPLES) {
      const rendered = LOCALES.map(
        (locale) => getDictionary(locale).home.exampleDescriptions[example.descriptionKey]
      );

      expect(new Set(rendered).size).toBe(LOCALES.length);
    }
  });

  it('never ships a blank string', () => {
    for (const locale of LOCALES) {
      const { blankStringPaths, stringCount } = inspectDictionary(getDictionary(locale));

      // Guards against the walk silently finding nothing to check.
      expect(stringCount).toBeGreaterThan(50);
      expect(blankStringPaths).toEqual([]);
    }
  });
});

describe('version and copyright', () => {
  it('keeps the advertised version in sync with package.json', () => {
    expect(APP_VERSION).toBe(packageJsonVersion);
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);

    for (const locale of LOCALES) {
      expect(getDictionary(locale).home.badge).toContain(`v${APP_VERSION}`);
    }
  });

  it('renders the copyright with the year supplied by the caller', () => {
    for (const locale of LOCALES) {
      expect(getDictionary(locale).home.copyright(2026)).toBe('© 2026 Git-to-Portfolio.');
    }
  });
});
