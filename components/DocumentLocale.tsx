'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLocale } from '@/lib/i18n';

export default function DocumentLocale() {
  const searchParams = useSearchParams();
  const locale = getLocale({ lang: searchParams.get('lang') ?? undefined });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
