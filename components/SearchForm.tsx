'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EXAMPLES } from '@/lib/examples';
import { getDictionary, withLocale, type Locale } from '@/lib/i18n';
import { normalizeUsername } from '@/lib/username';

type Props = {
  locale: Locale;
};

export default function SearchForm({ locale }: Props) {
  const dictionary = getDictionary(locale);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) {
      setError(
        username.trim()
          ? dictionary.search.invalidUsername
          : dictionary.search.emptyUsername,
      );
      return;
    }

    setError(null);
    startTransition(() => {
      const profilePath = `/${encodeURIComponent(normalizedUsername)}`;
      router.push(withLocale(profilePath, locale));
    });
  }

  return (
    <div className="w-full">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-3 sm:flex-row"
        aria-label={dictionary.search.formLabel}
        aria-busy={isPending}
        noValidate
      >
        <label htmlFor="github-username" className="sr-only">
          {dictionary.search.inputLabel}
        </label>
        <div className="min-w-0 flex-1">
          <div className="relative">
            {/* The field reads like a printed address line, so the host is set in
                mono type inside the box rather than as an icon adornment. The
                input's left padding has to clear this fixed-width prefix. */}
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted"
              aria-hidden="true"
            >
              github.com/
            </span>
            <input
              id="github-username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
              }}
              placeholder={dictionary.search.placeholder}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={200}
              disabled={isPending}
              aria-invalid={Boolean(error)}
              aria-errormessage={error ? 'github-username-error' : undefined}
              aria-describedby={[error ? 'github-username-error' : null, 'github-examples']
                .filter(Boolean)
                .join(' ') || undefined}
              className="input-premium box-border w-full min-w-0 py-3.5 pl-[108px] pr-3 text-base text-text-primary placeholder:text-text-muted sm:pl-32 sm:pr-4"
            />
          </div>
          {error && (
            <p
              id="github-username-error"
              className="mt-2 text-sm text-red-400"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              {error}
            </p>
          )}
          {isPending && (
            <p
              id="github-username-status"
              className="sr-only"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {dictionary.search.creating}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          aria-describedby={isPending ? 'github-username-status' : undefined}
          className="btn-primary flex w-full min-w-0 items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-[140px] sm:px-8"
        >
          <span>
            {isPending ? dictionary.search.creating : dictionary.search.create}
          </span>
          {isPending ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          )}
        </button>
      </form>

      <div
        id="github-examples"
        className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted"
      >
        <span>{dictionary.search.examples}</span>
        {EXAMPLES.map((example, index) => (
          <span key={example.username} className="inline-flex items-center gap-2">
            <Link
              prefetch={false}
              href={withLocale(`/${encodeURIComponent(example.username)}`, locale)}
              className="font-mono text-accent transition-colors hover:text-accent-hover"
            >
              /{example.username}
            </Link>
            {index < EXAMPLES.length - 1 && <span className="text-text-muted" aria-hidden="true">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
