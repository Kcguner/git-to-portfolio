'use client';

import { getDictionary, type Locale } from '@/lib/i18n';

export default function PrintButton({ locale }: { locale: Locale }) {
  const label = getDictionary(locale).print.label;

  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label={label}
      className="btn-primary inline-flex h-9 shrink-0 items-center gap-2 px-3 text-[13px] font-semibold sm:px-4"
    >
      {/* The label is long in every language, so it waits until there is
          genuinely room for it; the icon plus aria-label carry it before. `xl`
          is where the whole instrument row fits on one line, so the label can
          never wrap out of this fixed h-9 box. */}
      <span className="hidden xl:inline">{label}</span>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>
    </button>
  );
}
