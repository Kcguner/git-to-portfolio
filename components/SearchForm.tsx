'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EXAMPLES } from '@/lib/examples';
import { normalizeUsername } from '@/lib/username';

export default function SearchForm() {
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
          ? 'Geçerli bir GitHub kullanıcı adı veya github.com profil adresi girin.'
          : 'GitHub kullanıcı adı boş olamaz.',
      );
      return;
    }

    setError(null);
    startTransition(() => {
      router.push(`/${encodeURIComponent(normalizedUsername)}`);
    });
  }

  return (
    <div className="w-full">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
        aria-label="GitHub portföyü oluştur"
        aria-busy={isPending}
        noValidate
      >
        <label htmlFor="github-username" className="sr-only">
          GitHub kullanıcı adı
        </label>
        <div className="flex-1">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
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
              placeholder="GitHub kullanıcı adı... (örn. torvalds)"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={200}
              disabled={isPending}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'github-username-error' : undefined}
              className="input-premium w-full rounded-xl py-4 pl-12 pr-4 text-base text-text-primary placeholder:text-text-muted"
            />
          </div>
          {error && (
            <p id="github-username-error" className="mt-2 text-sm text-red-400" role="alert">
              <span aria-hidden="true">{error}</span>
              <span className="sr-only">{error}</span>
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary relative z-10 flex min-w-[140px] items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white disabled:cursor-wait disabled:opacity-70"
        >
          <span className="relative z-10">{isPending ? 'Oluşturuluyor…' : 'Oluştur'}</span>
          {isPending ? (
            <svg className="relative z-10 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="relative z-10 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          )}
        </button>
      </form>

      <div id="github-examples" className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted">
        <span>Örnekler:</span>
        {EXAMPLES.map((example, index) => (
          <span key={example.username} className="inline-flex items-center gap-2">
            <Link prefetch={false} href={`/${encodeURIComponent(example.username)}`} className="font-mono text-accent transition-colors hover:text-emerald-300">
              /{example.username}
            </Link>
            {index < EXAMPLES.length - 1 && <span className="text-border" aria-hidden="true">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

