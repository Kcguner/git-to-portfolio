import 'server-only';

import { german } from './de';
import { english } from './en';
import { spanish } from './es';
import { turkish } from './tr';
import type { Dictionary, Locale } from './types';

/**
 * Every dictionary, in one map.
 *
 * This is the only module that knows about all four languages at once, and it
 * is marked `server-only`: a Client Component that imports it fails the build
 * with "server-only cannot be imported from a Client Component module" rather
 * than quietly shipping three unused languages to every visitor.
 *
 * Server Components reach it through `getDictionary(locale)`; a Client
 * Component never sees a dictionary at all, it receives the handful of strings
 * it needs as props from its server parent.
 */
export const dictionaries: Record<Locale, Dictionary> = {
  tr: turkish,
  en: english,
  de: german,
  es: spanish,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
