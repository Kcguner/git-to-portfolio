'use client';

import { useLayoutEffect } from 'react';
import { useParams } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/consts';

/**
 * Keeps `<html lang>` in step with the locale in the URL.
 *
 * The locale is the first segment of every localized URL (`/en/torvalds`), so
 * the document's language is read from the path instead of from a query the
 * server no longer sees. A segment that is not one of the four supported
 * locales is not a locale at all, so it falls back to the default rather than
 * being rejected.
 *
 * The server renders `<html lang>` from the very same segment, so the first
 * document is already right. This effect is the insurance for the navigations
 * that come after it: a client-side `router.push` renders an RSC payload and
 * does not always re-render the root layout, so the attribute has to be
 * corrected once the route has changed.
 *
 * `useParams` reads the dynamic segments of the matched route and therefore
 * does not need a `<Suspense>` boundary, unlike `useSearchParams` did.
 */
export default function DocumentLocale() {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;

  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
