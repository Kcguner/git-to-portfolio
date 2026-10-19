import 'server-only';

import { APP_VERSION } from './consts';
import { ERROR_MESSAGES } from './error';
import type { Dictionary } from './types';

/**
 * The German dictionary. See `lib/i18n/tr.ts` for why every language lives in
 * its own module.
 */
export const german: Dictionary = {
  localeSwitcher: {
    label: 'Sprache auswählen',
  },
  theme: {
    label: 'Design',
    toNight: 'Zum Nachtmodus wechseln',
    toPaper: 'Zum Papiermodus wechseln',
  },
  header: {
    homeLabel: 'Git-to-Portfolio Startseite',
    documentation: 'Dokumentation',
  },
  search: {
    formLabel: 'GitHub-Portfolio erstellen',
    inputLabel: 'GitHub-Benutzername',
    placeholder: 'GitHub-Benutzername... (z. B. torvalds)',
    invalidUsername:
      'Gib einen gültigen GitHub-Benutzernamen oder eine github.com-Profiladresse ein.',
    emptyUsername: 'Der GitHub-Benutzername darf nicht leer sein.',
    creating: 'Wird erstellt…',
    create: 'Erstellen',
    examples: 'Beispiele:',
  },
  home: {
    badge: `v${APP_VERSION} — Portfolio aus GitHub`,
    heroBefore: 'Gib einen GitHub-Benutzernamen ein und erhalte in Sekunden ',
    heroHighlight: 'Git to Portfolio',
    heroAfter:
      ' — ein kostenloses, druckbares Entwicklerportfolio. Ohne Konto, ohne Setup, direkt als PDF.',
    howLabel: 'So funktioniert’s',
    howTitle: 'Portfolio in drei Schritten',
    howDescription: 'Keine komplexe Einrichtung und kein Konto nötig. Der Benutzername genügt.',
    steps: [
      {
        title: 'Benutzernamen eingeben',
        text: 'Gib oben einen GitHub-Benutzernamen ein. Das Profil wird automatisch geladen.',
      },
      {
        title: 'Portfolio ansehen',
        text: 'Avatar, Bio, die meistgenutzen Projekte und die Sprachen der ausgewählten Repositories werden automatisch angezeigt.',
      },
      {
        title: 'Drucken oder als PDF speichern',
        text: 'Drucke die Seite oder speichere sie als PDF – bereit für deine nächste Bewerbung.',
      },
    ],
    tryLabel: 'Jetzt ausprobieren',
    profilesTitle: 'Beliebte Profile',
    profilesDescription: 'Entdecke echte Portfolios mit einem Klick.',
    liveExamples: 'Live-Beispiele',
    exampleDescriptions: {
      kcguner: 'Ersteller dieser Seite',
      torvalds: 'Schöpfer von Linux',
    },
    howLink: 'So funktioniert’s',
    source: 'Quellcode',
    copyright: (year: number) => `© ${year} Git-to-Portfolio.`,
  },
  profile: {
    home: 'Startseite',
    profileOf: 'Profil /',
    portfolioTitle: 'GitHub-Portfolio',
    developerProfile: 'Entwicklerprofil',
    avatarAlt: 'Profilbild',
    profileLoading: 'Profil wird geladen…',
    followers: 'Follower',
    following: 'Folgt',
    repositories: 'Repos',
    email: 'E-Mail',
    blog: 'Blog',
    featuredLanguages: 'Sprachen der ausgewählten Repositories',
    topThree: 'TOP 3',
    topLanguages: 'Top 3 Sprachen',
    languagePercent: (name, formattedPercent) => `${name}, ${formattedPercent}`,
    footer: 'Erstellt mit Git-to-Portfolio · Daten von der GitHub API',
  },
  repositories: {
    unavailableTitle: 'Projekte konnten gerade nicht geladen werden.',
    unavailableDescription:
      'Beim Abrufen von GitHub-Daten ist ein vorübergehendes Problem aufgetreten. Bitte in wenigen Minuten erneut versuchen.',
    emptyTitle: 'Keine Repositories vorhanden.',
    emptyDescription:
      'Für dieses Benutzerkonto wurden keine öffentlichen Repositories gefunden.',
    projectsLabel: 'Projekte',
    title: 'Ausgewählte Repositories',
    pinnedTitle: 'Angeheftete Repositories',
    projectCount: (count) => `${count} PROJEKTE`,
    missingDescription: 'Für dieses Projekt ist keine Beschreibung verfügbar.',
    stars: 'Sterne',
    forks: 'Forks',
  },
  print: {
    label: 'Drucken / Als PDF speichern',
  },
  share: {
    label: 'Teilen',
    copied: 'Link in die Zwischenablage kopiert.',
    shared: 'Portfolio geteilt.',
    copyError: 'Der Link konnte nicht kopiert werden. Kopiere ihn stattdessen aus der Adressleiste.',
    shareError:
      'Das Freigabemenü konnte nicht geöffnet werden. Kopiere den Link stattdessen aus der Adressleiste.',
    dismiss: 'Hinweis schließen',
  },
  notFound: {
    pageLabel: 'Seite nicht gefunden',
    pageTitle: 'Die gewünschte Seite gibt es nicht',
    pageDescription:
      'Die Seite wurde möglicherweise verschoben oder hat nie existiert. Kehre zur Startseite zurück und versuche es erneut.',
    userLabel: 'Profil nicht gefunden',
    userTitle: 'Benutzer nicht gefunden',
    userDescription:
      'Der gesuchte GitHub-Benutzer wurde nicht gefunden. Prüfe den Benutzernamen und versuche es erneut.',
    backHome: 'Zurück zur Startseite',
  },
  error: ERROR_MESSAGES.de,
  metadata: {
    userNotFoundTitle: 'Benutzer nicht gefunden',
    homeTitle: 'Git to Portfolio — GitHub-Portfolio & Lebenslauf erstellen',
    homeDescription:
      'Erstelle aus einem GitHub-Benutzernamen mit Git to Portfolio ein sauberes, druckbares Entwicklerportfolio. Kostenlos, ohne Anmeldung, in Sekunden als PDF.',
    portfolioDescription: (name) =>
      `GitHub-Portfolio von ${name} mit ausgewählten Projekten und Repository-Sprachen.`,
    portfolioTitle: (name) => `${name} | GitHub-Portfolio`,
    homeKeywords: [
      'git to portfolio',
      'GitHub Portfolio erstellen',
      'GitHub Portfolio Generator',
      'GitHub Portfolio Website',
      'GitHub Profil Portfolio',
      'GitHub Lebenslauf',
      'Entwickler Lebenslauf',
      'druckbarer Lebenslauf',
      'PDF Lebenslauf',
      'Programmierer Portfolio',
    ],
    portfolioKeywords: (name) => [
      `${name} GitHub Portfolio`,
      `${name} Portfolio`,
      `${name} GitHub Projekte`,
      `${name} Projekte`,
      'GitHub Portfolio',
      'Entwicklerportfolio',
    ],
    ogImage: {
      alt: 'Git-to-Portfolio — druckbares Portfolio aus einem GitHub-Profil erstellen',
      headline: 'Von GitHub zum Portfolio.',
      subtitle:
        'Gib einen Benutzernamen ein und erhalte in Sekunden ein sauberes, druckbares Entwicklerportfolio.',
      footer: 'Verwandle dein GitHub-Profil in ein Portfolio.',
      badge: 'SEO und Teilen bereit',
    },
    profileOgImage: {
      alt: (name) => `GitHub-Portfolio von ${name}`,
      label: 'GitHub-Portfolio',
      featured: 'Ausgewählte GitHub-Projekte',
      share: 'GitHub-Profil teilen',
      footer: 'Erstellt mit Git-to-Portfolio',
      unknownUser: 'GitHub-Benutzer',
    },
  },
};
