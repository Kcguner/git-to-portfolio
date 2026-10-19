import { locale as getRootLocale } from 'next/root-params';
import type { Metadata } from 'next';
import { DEFAULT_LOCALE, getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { getNoIndexMetadata, SITE_NAME } from '@/lib/seo';
import NotFoundView from '@/components/NotFoundView';

/**
 * The locale of the segment this 404 belongs to.
 *
 * `not-found.tsx` receives neither params nor searchParams, so the language
 * comes from the root parameter: the `locale` segment of the URL the visitor
 * asked for. The getter is typed as `Promise<string>`, but the generated type
 * does not describe the one case where there is no segment at all — the global
 * 404 — so the value is validated before it is used and falls back to the
 * default language rather than being trusted.
 */
async function getRequestLocale(): Promise<Locale> {
  const raw = await getRootLocale();
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);

  return getNoIndexMetadata(locale, {
    title: `${dictionary.notFound.pageTitle} | ${SITE_NAME}`,
    description: dictionary.notFound.pageDescription,
  });
}

export default async function NotFound() {
  const locale = await getRequestLocale();
  return <NotFoundView locale={locale} kind="page" />;
}
