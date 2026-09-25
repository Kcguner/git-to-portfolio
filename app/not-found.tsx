import { headers } from "next/headers";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromHeaderValue, LOCALE_HEADER } from "@/lib/locale-negotiation";
import NotFoundView from "@/components/NotFoundView";

const NO_INDEX = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const;

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

  return {
    // The not-found segment is the leaf of its loader tree, so the root
    // layout's title template is not applied to it. Emit the absolute title
    // to keep the SSR value identical to the rest of the site.
    title: {
      absolute: `${dictionary.notFound.pageTitle} | ${dictionary.metadata.homeTitle}`,
    },
    robots: { ...NO_INDEX },
  };
}

export default async function NotFound() {
  const locale = await getRequestLocale();
  return <NotFoundView locale={locale} kind="page" />;
}
