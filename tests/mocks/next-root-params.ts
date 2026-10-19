/**
 * A stand-in for `next/root-params`.
 *
 * The real module is a placeholder that **throws** the moment it is imported
 * outside a Next.js request (`node_modules/next/root-params.js`), so a test
 * that imports a not-found page would fail at import time with a message that
 * reads like a bug in the app rather than like a missing mock. The alias in
 * `vitest.config.mts` points `next/root-params` here, so the app's own import
 * resolves to this module and the test decides what the root parameter is.
 *
 * The app uses exactly one getter — `locale`, the first segment of the
 * localized URL — so that is all this mock provides. It returns a promise,
 * like the real one does.
 */

/** The value `locale()` resolves to. `undefined` means "there is no segment". */
let rootLocale: string | undefined;

/**
 * Sets the locale segment the next request would have carried.
 *
 * Pass `undefined` for the global 404, which has no locale segment at all.
 */
export function setRootLocale(value: string | undefined): void {
  rootLocale = value;
}

/** Forgets the segment, so the next test starts from the global 404. */
export function resetRootLocale(): void {
  rootLocale = undefined;
}

/** The root parameter the app reads: the locale segment of the URL. */
export async function locale(): Promise<string | undefined> {
  return rootLocale;
}
