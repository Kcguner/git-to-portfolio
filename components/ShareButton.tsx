'use client';

import { useState } from 'react';
import { getDictionary, type Locale } from '@/lib/i18n';

type ShareStatus = 'idle' | 'copied' | 'shared' | 'copy-error' | 'share-error';

type ShareButtonProps = {
  locale: Locale;
  title: string;
  text: string;
  url: string;
};

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

export default function ShareButton({ locale, title, text, url }: ShareButtonProps) {
  const share = getDictionary(locale).share;
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [isPending, setIsPending] = useState(false);

  async function handleShare() {
    const hasNativeShare =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    setStatus('idle');
    setIsPending(true);

    try {
      if (hasNativeShare) {
        await navigator.share({ title, text, url });
        setStatus('shared');
        return;
      }

      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable');
      }

      await navigator.clipboard.writeText(url);
      setStatus('copied');
    } catch (error) {
      if (hasNativeShare && isAbortError(error)) {
        setStatus('idle');
      } else {
        setStatus(hasNativeShare ? 'share-error' : 'copy-error');
      }
    } finally {
      setIsPending(false);
    }
  }

  const message =
    status === 'copied'
      ? share.copied
      : status === 'shared'
        ? share.shared
        : status === 'copy-error'
          ? share.copyError
          : status === 'share-error'
            ? share.shareError
            : null;
  const isError = status === 'copy-error' || status === 'share-error';

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-label={share.label}
        aria-busy={isPending}
        disabled={isPending}
        className="no-print inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-border-hover disabled:cursor-wait disabled:opacity-60 sm:px-4"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className="hidden sm:inline">{share.label}</span>
      </button>

      {message && (
        <div
          role={isError ? 'alert' : 'status'}
          aria-live={isError ? 'assertive' : 'polite'}
          aria-atomic="true"
          className={`no-print fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${
            isError
              ? 'border-red-400/30 bg-red-950/95 text-red-100'
              : 'border-accent/30 bg-surface/95 text-text-primary'
          }`}
        >
          <svg
            className={`mt-0.5 h-5 w-5 shrink-0 ${isError ? 'text-red-300' : 'text-accent'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isError ? (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            ) : (
              <path d="m5 12 4 4L19 6" />
            )}
          </svg>
          <span>{message}</span>
        </div>
      )}
    </>
  );
}
