'use client';

import type { ChangeEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getDictionary,
  isLocale,
  LOCALE_LABELS,
  LOCALES,
  withLocale,
  type Locale,
} from '@/lib/i18n';

type Props = {
  locale: Locale;
};

export default function LocaleSwitcher({ locale }: Props) {
  const dictionary = getDictionary(locale);
  const pathname = usePathname();
  const router = useRouter();

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    if (!isLocale(nextLocale) || nextLocale === locale) return;

    const search = typeof window === 'undefined' ? '' : window.location.search;
    const hash = typeof window === 'undefined' ? '' : window.location.hash;
    router.push(withLocale(pathname, nextLocale, search, hash), { scroll: false });
  }

  return (
    /* appearance-none removes the native control, so the chevron below has to
       be drawn by hand and the extra right padding reserved for it. */
    <label className="relative inline-flex items-center gap-2">
      <span className="sr-only">{dictionary.localeSwitcher.label}</span>
      <svg className="hidden h-4 w-4 text-text-muted sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
      <select
        value={locale}
        onChange={onChange}
        aria-label={dictionary.localeSwitcher.label}
        className="h-9 cursor-pointer appearance-none border border-border bg-surface-elevated pl-2.5 pr-6 text-sm font-medium text-text-primary transition-colors hover:border-border-hover focus:border-accent sm:pl-3 sm:pr-7"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option}>
            {LOCALE_LABELS[option]}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-1.5 h-4 w-4 text-text-muted sm:right-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </label>
  );
}
