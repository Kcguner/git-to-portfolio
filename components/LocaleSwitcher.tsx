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
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">{dictionary.localeSwitcher.label}</span>
      <svg className="hidden h-4 w-4 text-text-muted sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
      <select
        value={locale}
        onChange={onChange}
        aria-label={dictionary.localeSwitcher.label}
        className="cursor-pointer rounded-lg border border-border bg-surface-elevated px-2.5 py-2 text-sm font-medium text-text-primary transition-colors hover:border-border-hover focus:border-accent sm:px-3"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option}>
            {LOCALE_LABELS[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
