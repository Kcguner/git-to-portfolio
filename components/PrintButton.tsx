'use client';

import { getDictionary, type Locale } from '@/lib/i18n';

export default function PrintButton({ locale }: { locale: Locale }) {
  const label = getDictionary(locale).print.label;

  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label={label}
      className="btn-primary relative z-10 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white sm:px-4"
    >
      <span className="relative z-10 hidden sm:inline">{label}</span>
      <svg className="relative z-10 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>
    </button>
  );
}
