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

  // Root layouts cannot read page searchParams. Updating the attribute in a
  // layout effect keeps the server-rendered default (tr) while making the
  // client locale correct before the browser paints.
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
  const dictionary = getDictionary(locale);

  useLayoutEffect(() => {
    const pageTitle = kind === 'user'
      ? dictionary.metadata.userNotFoundTitle
      : dictionary.notFound.pageTitle;
    document.title = `${pageTitle} | Git-to-Portfolio`;
  }, [dictionary, kind]);

  return <NotFoundView locale={locale} kind={kind} />;
}
