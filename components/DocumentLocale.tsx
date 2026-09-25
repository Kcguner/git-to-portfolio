'use client';

import { useLayoutEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLocaleFromQueryValues } from '@/lib/i18n';

export default function DocumentLocale() {
  const searchParams = useSearchParams();
  const locale = getLocaleFromQueryValues(searchParams.getAll('lang'));

  // Proxy already resolved <html lang> on the server for the initial
  // document. This effect is still required for client-side router.push
  // navigations: those render RSC payloads and never re-render the root
  // layout, so the attribute has to be corrected after the route changes.
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
