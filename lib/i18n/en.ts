import 'server-only';

import { APP_VERSION } from './consts';
import { ERROR_MESSAGES } from './error';
import type { Dictionary } from './types';

/**
 * The English dictionary. See `lib/i18n/tr.ts` for why every language lives
 * in its own module.
 */
export const english: Dictionary = {
  localeSwitcher: {
    label: 'Select language',
  },
  theme: {
    label: 'Theme',
    toNight: 'Switch to night theme',
    toPaper: 'Switch to paper theme',
  },
  header: {
    homeLabel: 'Git-to-Portfolio home',
    documentation: 'Documentation',
  },
  search: {
    formLabel: 'Create a GitHub portfolio',
    inputLabel: 'GitHub username',
    placeholder: 'GitHub username... (e.g. torvalds)',
    invalidUsername: 'Enter a valid GitHub username or github.com profile URL.',
    emptyUsername: 'GitHub username is required.',
    creating: 'Creating…',
    create: 'Create',
    examples: 'Examples:',
  },
  home: {
    badge: `v${APP_VERSION} — Portfolio from GitHub`,
    heroBefore: 'Enter a GitHub username and turn it into a free, printable ',
    heroHighlight: 'Git to Portfolio',
    heroAfter:
      ' in seconds. No signup, no setup — save it as PDF and send it with your application.',
    howLabel: 'How it works',
    howTitle: 'Your portfolio in three steps',
    howDescription: 'No complex setup and no account required. All you need is a username.',
    steps: [
      {
        title: 'Enter a username',
        text: 'Type a GitHub username in the box above. We will fetch the profile automatically.',
      },
      {
        title: 'View the portfolio',
        text: 'The avatar, bio, most-starred projects and featured repository languages are listed automatically.',
      },
      {
        title: 'Print or save as PDF',
        text: 'Print the page or save it as a PDF, ready for your next job application.',
      },
    ],
    tryLabel: 'Try it now',
    profilesTitle: 'Popular profiles',
    profilesDescription: 'Explore real portfolios with one click.',
    liveExamples: 'Live examples',
    exampleDescriptions: {
      kcguner: 'Creator of this site',
      torvalds: 'Creator of Linux',
    },
    howLink: 'How it works',
    source: 'Source',
    copyright: (year: number) => `© ${year} Git-to-Portfolio.`,
  },
  profile: {
    home: 'Home',
    profileOf: 'Profile /',
    portfolioTitle: 'GitHub portfolio',
    developerProfile: 'Developer profile',
    avatarAlt: 'avatar',
    profileLoading: 'Loading profile…',
    followers: 'Followers',
    following: 'Following',
    repositories: 'Repos',
    email: 'Email',
    blog: 'Blog',
    featuredLanguages: 'Featured repository languages',
    topThree: 'TOP 3',
    topLanguages: 'Top 3 languages',
    languagePercent: (name, formattedPercent) => `${name}, ${formattedPercent}`,
    footer: 'Created with Git-to-Portfolio · Data from the GitHub API',
  },
  repositories: {
    unavailableTitle: 'Projects could not be loaded right now.',
    unavailableDescription:
      'There was a temporary problem reaching GitHub. Please try again in a few minutes.',
    emptyTitle: 'No repositories to show.',
    emptyDescription: 'No public repositories were found for this user.',
    projectsLabel: 'Projects',
    title: 'Featured repositories',
    pinnedTitle: 'Pinned repositories',
    projectCount: (count) => `${count} PROJECTS`,
    missingDescription: 'No description is available for this project.',
    stars: 'Stars',
    forks: 'Forks',
  },
  print: {
    label: 'Print / Save as PDF',
  },
  share: {
    label: 'Share',
    copied: 'Link copied to clipboard.',
    shared: 'Portfolio shared.',
    copyError: 'The link could not be copied. Copy it from the address bar instead.',
    shareError: 'The share sheet could not be opened. Copy the link from the address bar instead.',
    dismiss: 'Dismiss notification',
  },
  notFound: {
    pageLabel: 'Page not found',
    pageTitle: 'The page you requested does not exist',
    pageDescription: 'The page may have moved or never existed. Return home and try again.',
    userLabel: 'Profile not found',
    userTitle: 'User not found',
    userDescription:
      'The GitHub user you requested could not be found. Check the username and try again.',
    backHome: 'Back to home',
  },
  error: ERROR_MESSAGES.en,
  metadata: {
    userNotFoundTitle: 'User not found',
    homeTitle: 'Git to Portfolio — Free GitHub Portfolio & Resume Builder',
    homeDescription:
      'Turn a GitHub username into a clean, printable developer portfolio and resume with Git to Portfolio. Free, no signup, ready as PDF in seconds.',
    portfolioDescription: (name) =>
      `GitHub portfolio for ${name}, featuring highlighted projects and repository languages.`,
    portfolioTitle: (name) => `${name} | GitHub portfolio`,
    homeKeywords: [
      'git to portfolio',
      'git to portfolio github',
      'GitHub portfolio',
      'GitHub portfolio generator',
      'GitHub portfolio builder',
      'GitHub profile portfolio',
      'GitHub resume',
      'developer CV',
      'printable resume',
      'PDF resume',
      'software developer portfolio',
    ],
    portfolioKeywords: (name) => [
      `${name} GitHub portfolio`,
      `${name} portfolio`,
      `${name} GitHub projects`,
      `${name} projects`,
      'GitHub portfolio',
      'developer portfolio',
    ],
    ogImage: {
      alt: 'Git-to-Portfolio — create a printable portfolio from a GitHub profile',
      headline: 'From GitHub to portfolio.',
      subtitle: 'Enter a username and get a clean, printable developer portfolio in seconds.',
      footer: 'Turn your GitHub profile into a portfolio.',
      badge: 'SEO and sharing ready',
    },
    profileOgImage: {
      alt: (name) => `GitHub portfolio of ${name}`,
      label: 'GitHub portfolio',
      featured: 'Featured GitHub projects',
      share: 'GitHub profile share',
      footer: 'Created with Git-to-Portfolio',
      unknownUser: 'GitHub user',
    },
  },
};
