'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getDictionary, type Locale } from '@/lib/i18n';

type ShareStatus = 'idle' | 'copied' | 'shared' | 'copy-error' | 'share-error';

type ShareButtonProps = {
  locale: Locale;
  title: string;
  text: string;
  url: string;
};

/**
 * Success is a quick confirmation, so the toast clears after 4s. Errors carry a
 * recovery instruction ("copy it from the address bar instead") that is worth
 * reading twice as slowly, so they stay for 8s. Both are always dismissible by
 * hand via the close control.
 */
const SUCCESS_DISMISS_MS = 4000;
const ERROR_DISMISS_MS = 8000;

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

function isErrorStatus(status: ShareStatus): boolean {
  return status === 'copy-error' || status === 'share-error';
}

export default function ShareButton({ locale, title, text, url }: ShareButtonProps) {
  const share = getDictionary(locale).share;
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [isPending, setIsPending] = useState(false);
  // Single-slot ref: a new share attempt or a manual dismiss always clears the
  // previous timer, so a stale timer can never wipe a newer message.
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current !== null) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(
    (next: ShareStatus) => {
      clearDismissTimer();
      dismissTimer.current = setTimeout(() => {
        dismissTimer.current = null;
        setStatus('idle');
      }, isErrorStatus(next) ? ERROR_DISMISS_MS : SUCCESS_DISMISS_MS);
    },
    [clearDismissTimer]
  );

  const dismiss = useCallback(() => {
    clearDismissTimer();
    setStatus('idle');
  }, [clearDismissTimer]);

  useEffect(() => () => clearDismissTimer(), [clearDismissTimer]);

  async function handleShare() {
    const hasNativeShare =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    clearDismissTimer();
    setStatus('idle');
    setIsPending(true);

    try {
      if (hasNativeShare) {
        await navigator.share({ title, text, url });
        setStatus('shared');
        scheduleDismiss('shared');
        return;
      }

      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable');
      }

      await navigator.clipboard.writeText(url);
      setStatus('copied');
      scheduleDismiss('copied');
    } catch (error) {
      if (hasNativeShare && isAbortError(error)) {
        setStatus('idle');
      } else {
        const next: ShareStatus = hasNativeShare ? 'share-error' : 'copy-error';
        setStatus(next);
        scheduleDismiss(next);
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
  const isError = isErrorStatus(status);

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
        <span className="hidden lg:inline">{share.label}</span>
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
          <span className="flex-1">{message}</span>
          <button
            type="button"
            onClick={dismiss}
            aria-label={share.dismiss}
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
