import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../../lib/examples';
import {
  APP_VERSION,
  DEFAULT_LOCALE,
  dictionaries,
  getBasePathname,
  getDictionary,
  getLocaleAlternates,
  getLocaleFromSegment,
  getProfileBasePathname,
  getProfileOpenGraphImagePath,
  getProfilePathname,
  isLocale,
  LOCALE_LABELS,
  LOCALE_TAGS,
  LOCALES,
  OPEN_GRAPH_LOCALES,
  withBaseLocale,
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

describe('getLocaleFromSegment', () => {
  it.each(LOCALES)('accepts the supported %s locale', (locale) => {
    expect(getLocaleFromSegment(locale)).toBe(locale);
  });

  it('defaults safely when the segment is missing', () => {
    expect(getLocaleFromSegment(undefined)).toBe('tr');
    expect(getLocaleFromSegment(null)).toBe('tr');
    expect(getLocaleFromSegment('')).toBe('tr');
  });

  it.each(['fr', 'EN', 'en-US', 'tr-TR'])(
    'falls back for an unsupported segment: %s',
    (value) => {
      expect(getLocaleFromSegment(value)).toBe('tr');
    },
  );
});

describe('profile paths', () => {
  it('puts the locale in front of the username', () => {
    expect(getProfilePathname('torvalds', 'en')).toBe('/en/torvalds');
    expect(getProfilePathname('torvalds', 'tr')).toBe('/tr/torvalds');
  });

  it('percent-encodes the username', () => {
    expect(getProfilePathname('octo cat', 'es')).toBe('/es/octo%20cat');
  });

  it('keeps the base path of a profile free of a locale segment', () => {
    expect(getProfileBasePathname('torvalds')).toBe('/torvalds');
    expect(getProfileBasePathname('octo cat')).toBe('/octo%20cat');
    // The account called `en` has the base path `/en`, and nothing else.
    expect(getProfileBasePathname('en')).toBe('/en');
  });

  it('addresses the social card under the locale it belongs to', () => {
    expect(getProfileOpenGraphImagePath('octocat', 'es')).toBe(
      '/es/octocat/opengraph-image/es',
    );
  });
});

describe('base paths', () => {
  it('leaves a path without a locale segment alone', () => {
    expect(getBasePathname('/')).toBe('/');
    expect(getBasePathname('/torvalds')).toBe('/torvalds');
  });

  it('strips an existing locale segment exactly once', () => {
    expect(getBasePathname('/en/torvalds')).toBe('/torvalds');
    expect(getBasePathname('/en/en')).toBe('/en');
  });

  it('does not read a lone segment as a locale', () => {
    // `/en` is the base path of the account called `en`, not the English home.
    expect(getBasePathname('/en')).toBe('/en');
    expect(getBasePathname('/tr')).toBe('/tr');
    expect(getBasePathname('/de')).toBe('/de');
    expect(getBasePathname('/es')).toBe('/es');
  });

  it('prefixes a base path with a locale without touching it', () => {
    expect(withBaseLocale('/torvalds', 'en')).toBe('/en/torvalds');
    expect(withBaseLocale('/', 'tr')).toBe('/tr');
    // The account called `en` keeps its own name behind the locale.
    expect(withBaseLocale('/en', 'en')).toBe('/en/en');
  });

  it('publishes the account called `en` under its own four addresses', () => {
    // The locale is only ever put in front of the base path, so the account
    // called `en` is never published as the English home.
    expect(withBaseLocale('/en', 'tr')).toBe('/tr/en');
    expect(withBaseLocale('/en', 'en')).toBe('/en/en');
    expect(withBaseLocale('/en', 'de')).toBe('/de/en');
    expect(withBaseLocale('/en', 'es')).toBe('/es/en');
  });

  it('does not read a lone leading segment as a locale', () => {
    // `withLocale()` is the full-path builder and *does* replace the leading
    // segment: `/en` is the English home there, so it becomes `/de`. The
    // base-path builder never does that.
    expect(withLocale('/en', 'de')).toBe('/de');
    expect(withBaseLocale('/en', 'de')).toBe('/de/en');
  });
});

describe('the server barrel', () => {
  it('re-exports the base-path helpers, so no caller reaches into the consts module', async () => {
    const consts = await import('../../lib/i18n/consts');

    expect(getBasePathname).toBe(consts.getBasePathname);
    expect(getProfileBasePathname).toBe(consts.getProfileBasePathname);
    expect(withBaseLocale).toBe(consts.withBaseLocale);
  });
});

describe('getLocaleAlternates', () => {
  it('builds one hreflang target per supported locale', () => {
    expect(getLocaleAlternates('/torvalds')).toEqual({
      'tr-TR': '/tr/torvalds',
      'en-US': '/en/torvalds',
      'de-DE': '/de/torvalds',
      'es-ES': '/es/torvalds',
      'x-default': '/tr/torvalds',
    });
  });

  it('points the home page at the four locale homes', () => {
    expect(getLocaleAlternates('/')).toEqual({
      'tr-TR': '/tr',
      'en-US': '/en',
      'de-DE': '/de',
      'es-ES': '/es',
      'x-default': '/tr',
    });
  });

  it('never stacks two locale prefixes on top of each other', () => {
    expect(getLocaleAlternates('/en/torvalds')).toEqual({
      'tr-TR': '/tr/torvalds',
      'en-US': '/en/torvalds',
      'de-DE': '/de/torvalds',
      'es-ES': '/es/torvalds',
      'x-default': '/tr/torvalds',
    });
  });

  it('reads an already localized path as the same page', () => {
    // `/en/torvalds` is the English address of the account `torvalds`: it is
    // the same page as the base path `/torvalds`, and the cluster is the one
    // of that page.
    expect(getLocaleAlternates('/en/torvalds')).toEqual({
      'tr-TR': '/tr/torvalds',
      'en-US': '/en/torvalds',
      'de-DE': '/de/torvalds',
      'es-ES': '/es/torvalds',
      'x-default': '/tr/torvalds',
    });
    // `/en/en` is the English address of the account called `en`. The prefix
    // is removed once, so this is the account `en` and not a path with a
    // locale on top of a locale.
    expect(getLocaleAlternates('/en/en')).toEqual({
      'tr-TR': '/tr/en',
      'en-US': '/en/en',
      'de-DE': '/de/en',
      'es-ES': '/es/en',
      'x-default': '/tr/en',
    });
  });

  it('does not read a username that looks like a locale as a locale', () => {
    // The GitHub account `en` exists. Its base path is `/en`, and its four
    // published addresses are `/tr/en`, `/en/en`, `/de/en` and `/es/en` —
    // never the four language homes.
    expect(getLocaleAlternates('/en')).toEqual({
      'tr-TR': '/tr/en',
      'en-US': '/en/en',
      'de-DE': '/de/en',
      'es-ES': '/es/en',
      'x-default': '/tr/en',
    });
    expect(getLocaleAlternates('/tr')).toEqual({
      'tr-TR': '/tr/tr',
      'en-US': '/en/tr',
      'de-DE': '/de/tr',
      'es-ES': '/es/tr',
      'x-default': '/tr/tr',
    });
    expect(getLocaleAlternates('/de')).toEqual({
      'tr-TR': '/tr/de',
      'en-US': '/en/de',
      'de-DE': '/de/de',
      'es-ES': '/es/de',
      'x-default': '/tr/de',
    });
    expect(getLocaleAlternates('/es')).toEqual({
      'tr-TR': '/tr/es',
      'en-US': '/en/es',
      'de-DE': '/de/es',
      'es-ES': '/es/es',
      'x-default': '/tr/es',
    });
  });
});

describe('withLocale', () => {
  it('prefixes the pathname with the locale', () => {
    expect(withLocale('/torvalds', 'en')).toBe('/en/torvalds');
    expect(withLocale('/torvalds', 'tr')).toBe('/tr/torvalds');
  });

  it('maps the base path to the locale home', () => {
    expect(withLocale('/', 'tr')).toBe('/tr');
    expect(withLocale('', 'de')).toBe('/de');
  });

  it('replaces an existing locale segment instead of stacking one', () => {
    expect(withLocale('/en/torvalds', 'de')).toBe('/de/torvalds');
    expect(withLocale('/tr/torvalds', 'es')).toBe('/es/torvalds');
    expect(withLocale('/en', 'de')).toBe('/de');
  });

  it('drops the legacy lang query key and keeps every other value', () => {
    expect(withLocale('/torvalds', 'de', '?lang=tr&tab=repos&tag=nextjs')).toBe(
      '/de/torvalds?tab=repos&tag=nextjs',
    );
    expect(withLocale('/torvalds', 'en', '?lang=en')).toBe('/en/torvalds');
  });

  it('keeps the query string and the hash', () => {
    expect(withLocale('/torvalds', 'en', '?tab=repos', '#repos')).toBe(
      '/en/torvalds?tab=repos#repos',
    );
    // A hash that rides along inside the search string ends the URL rather
    // than being percent-encoded into the query value.
    expect(withLocale('/torvalds', 'en', '?tab=repos#x')).toBe(
      '/en/torvalds?tab=repos#x',
    );
  });

  it('serializes object query values, including repeated keys', () => {
    expect(
      withLocale('/', 'es', { view: ['compact', 'print'], tab: 'repos', empty: undefined }),
    ).toBe('/es?view=compact&view=print&tab=repos');
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
      expect(dictionary.theme.label).toBeTruthy();
      expect(dictionary.theme.toNight).toBeTruthy();
      expect(dictionary.theme.toPaper).toBeTruthy();
      expect(dictionary.search.inputLabel).toBeTruthy();
      expect(dictionary.profile.profileLoading).toBeTruthy();
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

  it('joins a language name with an already localized percentage', () => {
    // The percentage itself is formatted by Intl, so every locale is asked to
    // do the same thing: keep the name and put the value next to it.
    for (const locale of LOCALES) {
      const { languagePercent } = getDictionary(locale).profile;
      const label = languagePercent('TypeScript', '60%');

      expect(label).toContain('TypeScript');
      expect(label).toContain('60%');
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
