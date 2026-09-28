import Link from 'next/link';
import { getDictionary, withLocale, type Locale } from '@/lib/i18n';

export type NotFoundKind = 'page' | 'user';

type NotFoundViewProps = {
  locale: Locale;
  kind: NotFoundKind;
};

/**
 * The 404 body, rendered on the server.
 *
 * This deliberately lives outside `DocumentLocale.tsx`: the not-found segments
 * resolve the locale from the `x-site-locale` request header, so this view needs
 * no client hooks. Keeping it free of `useSearchParams` means the visible markup
 * is present in the initial HTML response instead of only after hydration.
 */
export default function NotFoundView({ locale, kind }: NotFoundViewProps) {
  const dictionary = getDictionary(locale).notFound;
  const isUserNotFound = kind === 'user';

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <main className="card-premium mx-auto flex w-full max-w-2xl flex-col p-8 md:p-12">
        {/* Sheet head: what is missing. */}
        <div className="border-b border-border pb-3">
          <span className="section-label">
            {isUserNotFound ? dictionary.userLabel : dictionary.pageLabel}
          </span>
        </div>

        {/*
          The status is the figure, the sentence beneath it is the annotation.
          The numeral repeats what the status line already says, so it is drawn
          as the drawing's own dimension rather than announced twice.
        */}
        <p
          aria-hidden="true"
          className="mt-8 font-sans text-7xl font-black leading-none tracking-tight text-text-primary md:text-8xl"
        >
          404
        </p>
        <div className="mt-6 h-1 w-16 bg-accent" aria-hidden="true" />

        <h1 className="gradient-text mt-6 font-sans text-2xl font-black tracking-tight md:text-3xl">
          {isUserNotFound ? dictionary.userTitle : dictionary.pageTitle}
        </h1>

        <p className="mt-4 font-mono text-sm leading-relaxed text-text-secondary">
          {isUserNotFound ? dictionary.userDescription : dictionary.pageDescription}
        </p>

        <LinkToHome locale={locale} label={dictionary.backHome} />
      </main>
    </div>
  );
}

function LinkToHome({ locale, label }: { locale: Locale; label: string }) {
  return (
    // No `text-white`: the button class carries its own ink, and paper white on
    // the night theme's signal yellow would fall below AA.
    <Link
      href={withLocale('/', locale)}
      className="btn-primary mt-8 inline-flex items-center px-6 py-3 font-semibold"
    >
      <span className="relative z-10">{label}</span>
    </Link>
  );
}
