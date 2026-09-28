'use client';

import { getDictionary, type Locale } from '@/lib/i18n';
import { paintThemeColor, themeCookie, type Theme } from '@/lib/theme';

type Props = {
  locale: Locale;
};

/**
 * The toggle flips the `dark` class on <html> and remembers the choice in a
 * cookie, which is what the root layout reads to render the right palette on
 * the server (`html.light` / `html.dark`).
 *
 * No effect and no client state: the server already put the correct class on
 * <html>, so both states are rendered and Tailwind's `dark:` variants pick
 * the visible one. The inactive branch is `display: none`, which also removes
 * it from the accessibility tree, so the button is always named by exactly the
 * label that describes what pressing it will do.
 *
 * Each branch draws the palette it switches *to*, never the one on screen. An
 * icon of the current theme reads as "switch to this", so a moon sitting on
 * the night page looks like a control with nothing left to do — and the label
 * in that same branch already names the other palette, so the two disagree.
 * The icon has to name the same target as the label beside it.
 */
export default function ThemeToggle({ locale }: Props) {
  const dictionary = getDictionary(locale);

  function onClick() {
    const root = document.documentElement;
    const next: Theme = root.classList.contains('dark') ? 'light' : 'dark';

    root.classList.remove('light', 'dark');
    root.classList.add(next);
    document.cookie = themeCookie(next);

    // The `theme-color` meta tag is resolved per request from the cookie, so
    // without this the browser keeps painting its own chrome — the tab, the
    // address bar, the overscroll area — in the palette the visitor just left
    // until the next full load. That is half a toggle that looks broken.
    paintThemeColor(next);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="no-print inline-flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-surface-elevated text-text-primary transition-colors hover:border-border-hover"
    >
      {/* On paper: the moon is what pressing this will give you. */}
      <span className="dark:hidden">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
        <span className="sr-only">{dictionary.theme.toNight}</span>
      </span>
      {/* At night: the sun. */}
      <span className="hidden dark:block">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <span className="sr-only">{dictionary.theme.toPaper}</span>
      </span>
    </button>
  );
}
