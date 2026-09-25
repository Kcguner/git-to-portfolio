import { headers } from "next/headers";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromHeaderValue, LOCALE_HEADER } from "@/lib/locale-negotiation";
import { getNoIndexMetadata } from "@/lib/seo";
import NotFoundView from "@/components/NotFoundView";

// `not-found.tsx` receives neither params nor searchParams, so the locale and
// the localized title both come from the `x-site-locale` request header the
// root layout reads. Proxy resolves it before the route renders, so both the
// SSR <title> and the visible markup are correct before hydration. The body
// needs no client hook, so it needs no Suspense boundary either.
async function getRequestLocale() {
  return getLocaleFromHeaderValue((await headers()).get(LOCALE_HEADER));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);

  return getNoIndexMetadata(locale, {
    title: `${dictionary.notFound.pageTitle} | ${dictionary.metadata.homeTitle}`,
    description: dictionary.notFound.pageDescription,
  });
}

export default async function NotFound() {
  const locale = await getRequestLocale();
  return <NotFoundView locale={locale} kind="page" />;
}
