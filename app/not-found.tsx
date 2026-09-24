import Link from 'next/link';
import { getDictionary, DEFAULT_LOCALE } from '@/lib/i18n';

export default function NotFound() {
  const dictionary = getDictionary(DEFAULT_LOCALE).notFound;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="orb orb-1" aria-hidden="true" />
      <main className="card-premium relative z-10 mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl p-8 text-center md:p-12">
        <div className="step-number flex h-16 w-16 items-center justify-center rounded-2xl text-2xl" aria-hidden="true">404</div>
        <span className="section-label mt-6">{dictionary.pageLabel}</span>
        <h1 className="gradient-text mt-3 text-2xl font-bold tracking-tight md:text-3xl">{dictionary.pageTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{dictionary.pageDescription}</p>
        <Link href="/" className="btn-primary relative z-10 mt-7 rounded-xl px-6 py-3 font-semibold text-white">
          <span className="relative z-10">{dictionary.backHome}</span>
        </Link>
      </main>
    </div>
  );
}
