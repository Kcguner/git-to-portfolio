import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import { LocalizedNotFound, NotFoundView } from '@/components/DocumentLocale';

export const metadata: Metadata = {
  title: '404',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function NotFound() {
  return (
    <Suspense fallback={<NotFoundView locale={DEFAULT_LOCALE} kind="page" />}>
      <LocalizedNotFound kind="page" />
    </Suspense>
  );
}
