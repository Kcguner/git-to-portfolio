'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DEFAULT_LOCALE,
  getDictionary,
  getLocaleFromQueryValues,
  withLocale,
  type Locale,
} from '@/lib/i18n';

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function Error({ error, retry }: Props) {
  // Production'da server hata mesajları sanitize edilebilir. Kullanıcıya
  // güvenli, sabit bir mesaj göster; ayrıntıyı server loglarında tut.
  void error;

  // useSearchParams needs a Suspense boundary so the route can be statically
  // rendered in the future. The fallback is deliberately locale-independent
  // (the default dictionary) because no search params are readable from a
  // boundary that is still suspended.
  return (
    <Suspense fallback={<ErrorView locale={DEFAULT_LOCALE} retry={retry} />}>
      <LocalizedErrorView retry={retry} />
    </Suspense>
  );
}

function LocalizedErrorView({ retry }: { retry: () => void }) {
  const searchParams = useSearchParams();
  const locale = getLocaleFromQueryValues(searchParams.getAll('lang'));

  return <ErrorView locale={locale} retry={retry} />;
}

function ErrorView({ locale, retry }: { locale: Locale; retry: () => void }) {
  const dictionary = getDictionary(locale).error;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="orb orb-1" aria-hidden="true" />
      <main className="card-premium relative z-10 mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl p-8 text-center md:p-12">
        <div className="step-number flex h-16 w-16 items-center justify-center rounded-2xl text-2xl" aria-hidden="true">
          ⚠️
        </div>
        <span className="section-label mt-6">{dictionary.label}</span>
        <h1 className="gradient-text mt-3 text-2xl font-bold tracking-tight md:text-3xl">{dictionary.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{dictionary.description}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={retry}
            className="btn-primary relative z-10 rounded-xl px-6 py-3 font-semibold text-white"
          >
            <span className="relative z-10">{dictionary.retry}</span>
          </button>
          <Link
            href={withLocale('/', locale)}
            className="pill-btn rounded-xl px-6 py-3 font-semibold text-text-primary"
          >
            {dictionary.home}
          </Link>
        </div>
      </main>
    </div>
  );
}
