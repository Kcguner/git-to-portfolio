'use client';

import { useLayoutEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  getDictionary,
  getLocaleFromQueryValues,
  withLocale,
  type Locale,
} from '@/lib/i18n';

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

type NotFoundKind = 'page' | 'user';

type NotFoundViewProps = {
  locale: Locale;
  kind: NotFoundKind;
};

export function NotFoundView({ locale, kind }: NotFoundViewProps) {
  const dictionary = getDictionary(locale).notFound;
  const isUserNotFound = kind === 'user';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="orb orb-1" aria-hidden="true" />
      <main className="card-premium relative z-10 mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl p-8 text-center md:p-12">
        <div className="step-number flex h-16 w-16 items-center justify-center rounded-2xl text-2xl" aria-hidden="true">
          {isUserNotFound ? '🔍' : '404'}
        </div>
        <span className="section-label mt-6">
          {isUserNotFound ? dictionary.userLabel : dictionary.pageLabel}
        </span>
        <h1 className="gradient-text mt-3 text-2xl font-bold tracking-tight md:text-3xl">
          {isUserNotFound ? dictionary.userTitle : dictionary.pageTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {isUserNotFound ? dictionary.userDescription : dictionary.pageDescription}
        </p>
        <LinkToHome locale={locale} label={dictionary.backHome} />
      </main>
    </div>
  );
}

function LinkToHome({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link
      href={withLocale('/', locale)}
      className="btn-primary relative z-10 mt-7 rounded-xl px-6 py-3 font-semibold text-white"
    >
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

export function LocalizedNotFound({ kind }: { kind: NotFoundKind }) {
  const searchParams = useSearchParams();
  const locale = getLocaleFromQueryValues(searchParams.getAll('lang'));

  // The localized <title> is emitted from the server (the not-found segments
  // read the `x-site-locale` request header in generateMetadata), so there is
  // no document.title effect here. Only `html lang` still needs the client
  // correction, because router.push navigations render RSC payloads and do
  // not re-render the root layout.
  return <NotFoundView locale={locale} kind={kind} />;
}
