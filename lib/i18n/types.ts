import type { ExampleDescriptionKey } from '../examples';

/**
 * The locales the site serves.
 *
 * The union is written out by hand instead of being derived from the
 * `LOCALES` array so this module stays free of runtime code: a client
 * component can import a type from here without pulling a single byte into
 * the browser bundle. `lib/i18n/consts.ts` keeps the two in step with a
 * `satisfies` clause, so a locale that is added to one and not the other is a
 * compile-time error rather than a runtime `undefined`.
 */
export type Locale = 'tr' | 'en' | 'de' | 'es';

/**
 * The slices a Client Component is allowed to receive as props.
 *
 * These are the only parts of a dictionary that ever cross the server/client
 * boundary, so each one is small enough to name explicitly instead of
 * shipping the whole dictionary to the browser.
 */
export type LocaleSwitcherStrings = {
  label: string;
};

export type ThemeStrings = {
  label: string;
  toNight: string;
  toPaper: string;
};

export type SearchStrings = {
  formLabel: string;
  inputLabel: string;
  placeholder: string;
  invalidUsername: string;
  emptyUsername: string;
  creating: string;
  create: string;
  examples: string;
};

export type PrintStrings = {
  label: string;
};

export type ShareStrings = {
  label: string;
  copied: string;
  shared: string;
  copyError: string;
  shareError: string;
  dismiss: string;
};

export type ErrorStrings = {
  label: string;
  title: string;
  description: string;
  retry: string;
  home: string;
};

/**
 * The complete dictionary of one language.
 *
 * Every locale module is typed against this shape, so a missing or misspelled
 * key in one language is a compile-time error instead of a blank string in the
 * interface.
 */
export type Dictionary = {
  localeSwitcher: LocaleSwitcherStrings;
  theme: ThemeStrings;
  header: {
    homeLabel: string;
    documentation: string;
  };
  search: SearchStrings;
  home: {
    badge: string;
    heroBefore: string;
    heroHighlight: string;
    heroAfter: string;
    howLabel: string;
    howTitle: string;
    howDescription: string;
    steps: { title: string; text: string }[];
    tryLabel: string;
    profilesTitle: string;
    profilesDescription: string;
    liveExamples: string;
    exampleDescriptions: Record<ExampleDescriptionKey, string>;
    howLink: string;
    source: string;
    copyright: (year: number) => string;
  };
  profile: {
    home: string;
    profileOf: string;
    portfolioTitle: string;
    developerProfile: string;
    avatarAlt: string;
    profileLoading: string;
    followers: string;
    following: string;
    repositories: string;
    email: string;
    blog: string;
    featuredLanguages: string;
    topThree: string;
    topLanguages: string;
    // The percentage arrives already formatted for the locale by Intl
    // (`%60` in tr, `60%` in en, `60 %` in de/es), so each locale only decides
    // how the name and the value are joined in an aria-label.
    languagePercent: (name: string, formattedPercent: string) => string;
    footer: string;
  };
  repositories: {
    unavailableTitle: string;
    unavailableDescription: string;
    emptyTitle: string;
    emptyDescription: string;
    projectsLabel: string;
    title: string;
    pinnedTitle: string;
    projectCount: (count: number) => string;
    missingDescription: string;
    stars: string;
    forks: string;
  };
  print: PrintStrings;
  share: ShareStrings;
  notFound: {
    pageLabel: string;
    pageTitle: string;
    pageDescription: string;
    userLabel: string;
    userTitle: string;
    userDescription: string;
    backHome: string;
  };
  error: ErrorStrings;
  metadata: {
    userNotFoundTitle: string;
    homeTitle: string;
    homeDescription: string;
    portfolioDescription: (name: string) => string;
    portfolioTitle: (name: string) => string;
    homeKeywords: string[];
    portfolioKeywords: (name: string) => string[];
    ogImage: {
      alt: string;
      headline: string;
      subtitle: string;
      footer: string;
      badge: string;
    };
    profileOgImage: {
      alt: (name: string) => string;
      label: string;
      featured: string;
      share: string;
      footer: string;
      unknownUser: string;
    };
  };
};
