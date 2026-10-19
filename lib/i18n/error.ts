import type { ErrorStrings, Locale } from './types';

/**
 * The error boundary's copy, kept on its own.
 *
 * `app/error.tsx` is a Client Component with no server parent: a global error
 * boundary replaces the whole segment, so there is no server render that could
 * hand it the strings as props. Instead of pulling a whole dictionary into the
 * browser for five sentences, the error copy lives here in its own tiny slice
 * — the only dictionary text a client component is allowed to import.
 *
 * The locale dictionaries reuse these strings, so there is still exactly one
 * place where the error copy is written.
 */
export const ERROR_MESSAGES: Record<Locale, ErrorStrings> = {
  tr: {
    label: 'Git-to-Portfolio',
    title: 'Bir hata oluştu',
    description:
      'GitHub verileri alınırken geçici bir sorun oluştu. Lütfen kısa süre sonra tekrar deneyin.',
    retry: 'Tekrar dene',
    home: 'Ana sayfa',
  },
  en: {
    label: 'Git-to-Portfolio',
    title: 'Something went wrong',
    description:
      'There was a temporary problem loading GitHub data. Please try again shortly.',
    retry: 'Try again',
    home: 'Home',
  },
  de: {
    label: 'Git-to-Portfolio',
    title: 'Ein Fehler ist aufgetreten',
    description:
      'Beim Laden der GitHub-Daten ist ein vorübergehendes Problem aufgetreten. Bitte versuche es gleich noch einmal.',
    retry: 'Erneut versuchen',
    home: 'Startseite',
  },
  es: {
    label: 'Git-to-Portfolio',
    title: 'Se produjo un error',
    description:
      'Hubo un problema temporal al cargar los datos de GitHub. Inténtalo de nuevo en unos instantes.',
    retry: 'Reintentar',
    home: 'Inicio',
  },
};
