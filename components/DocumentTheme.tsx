'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { paintThemeColor, type Theme } from '@/lib/theme';

/**
 * Keeps the browser's own chrome in step with the palette the visitor is
 * actually looking at.
 *
 * `generateViewport` resolves the `theme-color` tag per request, which is right
 * for the first paint and wrong for everything after it. A client-side
 * navigation replays the cached root-layout payload instead of asking the server
 * again, so the tag falls back to the value the document was originally served
 * with, and the tab, the address bar and the overscroll area keep the palette the
 * visitor just left. The class on <html> survives, because nothing re-renders
 * it. So the tag is repainted from that class instead — the one thing that is
 * always current — on mount and after every route change.
 *
 * This is the theme half of what DocumentLocale does for the language.
 */
export default function DocumentTheme() {
  // Subscribing to the pathname is what re-renders this on a client-side
  // navigation; the value itself is not read.
  usePathname();

  useLayoutEffect(() => {
    const theme: Theme = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
    paintThemeColor(theme);
  });

  return null;
}
