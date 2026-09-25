import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { DEFAULT_LOCALE, getDictionary } from "@/lib/i18n";
import { getLocaleFromHeaderValue, LOCALE_HEADER } from "@/lib/locale-negotiation";
import { LocalizedNotFound, NotFoundView } from "@/components/DocumentLocale";

const NO_INDEX = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const;

// `not-found.tsx` receives neither params nor searchParams, so the localized
// title comes from the same `x-site-locale` request header the root layout
// reads. Proxy resolves it before the route renders, so the SSR <title> is
// already correct instead of being patched in a client layout effect.
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

export default function NotFound() {
  return (
    <Suspense fallback={<NotFoundView locale={DEFAULT_LOCALE} kind="page" />}>
      <LocalizedNotFound kind="page" />
    </Suspense>
  );
}
