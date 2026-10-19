import 'server-only';

/**
 * The i18n entry point for server code.
 *
 * The dictionary itself is split per language (`lib/i18n/tr.ts` and friends)
 * so a server render only ever loads the one language it needs, and the
 * client-safe helpers live in `lib/i18n/consts.ts`.
 *
 * The `server-only` marker is what keeps the copy out of the browser bundle:
 * this module reaches every dictionary, so a Client Component that imported it
 * would pull all four languages into the client chunk. Next.js turns such an
 * import into a build error, which is why the Client Components in this app
 * import `lib/i18n/consts.ts` instead and take their copy as props.
 *
 * The path helpers — the base-path ones included — are re-exported here as
 * well, so server code has one entry point for them. Reaching into
 * `lib/i18n/consts.ts` directly is only for the Client Components, which
 * cannot import this module at all.
 */
export {
  APP_VERSION,
  DEFAULT_LOCALE,
  getBasePathname,
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
} from './i18n/consts';

export type { LocaleSearchInput } from './i18n/consts';

export { dictionaries, getDictionary } from './i18n/dictionaries';

export type {
  Dictionary,
  ErrorStrings,
  Locale,
  LocaleSwitcherStrings,
  PrintStrings,
  SearchStrings,
  ShareStrings,
  ThemeStrings,
} from './i18n/types';
