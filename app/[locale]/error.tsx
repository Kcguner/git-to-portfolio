'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/consts';
import { ERROR_MESSAGES } from '@/lib/i18n/error';
import type { Locale } from '@/lib/i18n/types';

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function Error({ error, retry }: Props) {
  // Production'da server hata mesajları sanitize edilebilir. Kullanıcıya
  // güvenli, sabit bir mesaj göster; ayrıntıyı server loglarında tut.
  void error;

  // The error boundary is a Client Component, so it cannot read the root
  // parameter the way the server components do — `next/root-params` is
  // server-only. The locale is a path segment instead, and `useParams` is the
  // client-side view of the very same value. No `useSearchParams` and no
  // Suspense boundary are needed any more: a path segment is readable from
  // the router state, not from the query string.
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params?.locale) ? params.locale : DEFAULT_LOCALE;

  return <ErrorView locale={locale} retry={retry} />;
}

function ErrorView({ locale, retry }: { locale: Locale; retry: () => void }) {
  // A global error boundary is a Client Component with no server parent, so
  // there is no server render that could hand it the copy as props. It reads
  // the error slice instead — five sentences per language, and nothing else.
  const dictionary = ERROR_MESSAGES[locale];

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      {/* The same sheet the 404s are drawn on: a head, a figure, the reason and
          the way out. No icon and no colour that claims severity. */}
      <main className="card-premium mx-auto flex w-full max-w-2xl flex-col p-8 md:p-12">
        <div className="border-b border-border pb-3">
          <span className="section-label">{dictionary.label}</span>
        </div>

        <p
          aria-hidden="true"
          className="mt-8 font-sans text-6xl font-black uppercase leading-none tracking-tight text-text-primary md:text-7xl"
        >
          ERR
        </p>
        <div className="mt-6 h-1 w-16 bg-accent" aria-hidden="true" />

        <h1 className="gradient-text mt-6 font-sans text-2xl font-black tracking-tight md:text-3xl">
          {dictionary.title}
        </h1>

        <p className="mt-4 font-mono text-sm leading-relaxed text-text-secondary">
          {dictionary.description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {/* No `text-white`: the button class carries its own ink. */}
          <button
            type="button"
            onClick={retry}
            className="btn-primary inline-flex items-center px-6 py-3 font-semibold"
          >
            <span className="relative z-10">{dictionary.retry}</span>
          </button>
          <Link
            href={`/${locale}`}
            className="pill-btn inline-flex items-center px-6 py-3 font-semibold text-text-primary"
          >
            {dictionary.home}
          </Link>
        </div>
      </main>
    </div>
  );
}
