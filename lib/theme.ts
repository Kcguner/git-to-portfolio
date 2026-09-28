/**
 * The theme contract, kept in one module because two callers that never talk to
 * each other have to agree on it: the root layout reads the cookie and paints
 * the `theme-color` meta tag and the class on <html> before the first paint,
 * and the header toggle writes the same cookie and repaints both in the
 * browser. If the cookie name or a palette's chrome colour lived in only one of
 * them, the toggle would half-work — the page would change and the browser
 * chrome, or the next full load, would not.
 */

/** The two palettes the blueprint is drawn in: the night sheet and its paper inversion. */
export type Theme = 'light' | 'dark';

/** Where the choice is remembered. Read by the layout, written by the toggle. */
export const THEME_COOKIE = 'theme';

/**
 * The colour the browser paints its own chrome with. It cannot be a CSS custom
 * property — `<meta name="theme-color">` takes a literal — so these mirror the
 * two `--color-background` values in app/globals.css, and the toggle has to
 * carry them to the client.
 */
export const THEME_COLORS: Record<Theme, string> = {
  light: '#f4f6f9',
  dark: '#0a1628',
};

/** A year, on every path: one cookie covers the whole site, not one page. */
const THEME_COOKIE_MAX_AGE = 31536000;

/**
 * The exact string the toggle writes. The attributes live here so the max-age
 * and the scope cannot drift away from the name the layout reads.
 */
export function themeCookie(theme: Theme): string {
  return `${THEME_COOKIE}=${theme};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`;
}

/**
 * Paints the browser's own chrome — the tab, the address bar, the overscroll
 * area — with `theme`.
 *
 * The tag holds a literal, so it cannot follow the CSS custom property the rest
 * of the palette uses, and it has to be set by hand from two places: the toggle,
 * the moment the visitor presses it, and the document sync, after a client-side
 * navigation. Both call this, so the colour they paint is the one the layout
 * renders on the next request.
 */
export function paintThemeColor(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[theme]);
}
