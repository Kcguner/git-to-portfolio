# Changelog

All notable changes to Git-to-Portfolio are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic versioning.

## [Unreleased]

### Fixed

- A failed repository lookup no longer takes the whole profile page down. The GitHub Search API is rate limited far more aggressively than the profile endpoint, so a search failure now renders the profile card, the language block and an empty repository state, and logs the short GitHub error code once. Only a missing user becomes a 404; other upstream failures still reach the error boundary instead of being disguised as a missing profile.
- Profile pages render a single `<h1>` again. The page header title was demoted to a paragraph, and the profile page heading is now visible at every breakpoint instead of disappearing on small screens.
- The root layout renders the correct `<html lang>` on the server instead of shipping `lang="tr"` for every language and patching it from a client effect. `proxy.js` resolves the locale per request and forwards it internally; client-side navigation still corrects the attribute because RSC payloads do not re-render the layout.
- 404 pages emit a localized `<title>` from the server. Both not-found segments previously shipped hardcoded English titles and relied on a `document.title` mutation that fought the Metadata API and only ran after hydration.
- `next/image` can no longer be handed an avatar host that is not allowlisted, which threw and took down the entire portfolio. `images.remotePatterns` now covers the hosts GitHub actually returns, and an unknown host falls back to an initial-letter avatar that cannot fail.
- Featured-language bars are no longer blank when printed. Browsers strip background gradients, so the print stylesheet now renders the track and fill as flat greys with borders while the numeric percentage stays legible.
- Several near-white elements printed as invisible white-on-white, including repository names rendered as `div`s, the search submit button and the muted placeholder text. They are now forced to legible colours in print media.
- The share toast now dismisses itself and can be closed by hand, instead of staying on screen until the next click. Stale timers are cleared on re-share, manual dismiss and unmount.
- HSTS no longer advertises the `preload` directive. It is only meaningful once the domain is actually registered on the browser preload list.

### Changed

- Repository requests ask for the number of repositories the page displays instead of always requesting 100. The Open Graph image previously downloaded 100 repository objects to use three.
- The advertised version is kept in sync with `package.json` by a test instead of being hardcoded as `v1.0`, and the copyright year is derived from the current date.
- The example descriptions are keyed through an explicit `descriptionKey` in `lib/examples.ts`, so a missing translation in any of the four locales is a compile error rather than a silently wrong string.
- Sitemap entries no longer claim a build-time `lastmod`, which told crawlers every page changed on every deploy, and now carry absolute hreflang alternates for all four locales plus `x-default`.
- The application error boundary wraps its `useSearchParams` consumer in a Suspense boundary, so the route can be statically rendered later without silently falling back to client rendering.
- Added an MIT `LICENSE` file and a matching `license` field in `package.json`.

### Removed

- Portfolio page loading skeletons. A `loading.tsx` enables streamed rendering, which commits the HTTP status before the page resolves, so an unknown username answered `200` with only a skeleton instead of a real `404`.
- Dead code: the unused `metadata.fallbackDescription` and `header.info` dictionary entries in all four locales, the unused non-localized `formatDate` in `lib/skills.ts` that duplicated `RepoGrid`'s localized formatter, the hardcoded Turkish `description` field in `lib/examples.ts`, the unreferenced `.print-break-before` print class, the `favicon.ico` matcher exclusion for a file the project does not have, and the Playwright entries in `.gitignore` for a runner the project does not use.

### Security

- The avatar badge no longer combines a `title` attribute with `aria-hidden`, and repository star and fork metadata no longer duplicate their labels for screen readers.
- The search input now describes itself with the example usernames, so the `github-examples` block is no longer an orphaned id.

### Added

- Accessible profile sharing through the native Web Share API, with localized Clipboard API fallback and visible error feedback.
- Generated `app/manifest.ts` and web app identity metadata.
- Locale-aware canonical/hreflang metadata, `x-default`, localized 404/error screens and a generated web application manifest.
- Coverage thresholds, CI artifacts, route/component tests and GitHub data-layer edge-case tests.
- Self-hosted Inter and JetBrains Mono font assets.
- Per-request production CSP nonces and stricter environment/security documentation.

### Changed

- Featured language percentages are now calculated from the same six repositories displayed to users.
- GitHub requests normalize usernames before network access, retry transient timeouts/network failures and protect quota-sensitive Open Graph generation with short response caching.
- Site URL validation rejects credentials, query strings, fragments and unsafe paths.
- Profile Open Graph images use one language-independent design and a stable metadata image path.
- Next.js 16 image loading now uses the current `preload` API instead of deprecated `priority`.
- CI runs generated route types, coverage checks and production dependency auditing on Node.js 20 and 22.
- README documentation now covers sharing, manifest behavior, environment responsibilities, tests and the complete quality gate.

### Security

- Added a nonce-based Content Security Policy for production while retaining the development requirements needed by React and HMR.
- Preserved clickjacking, MIME-sniffing, referrer, permissions and HSTS protections.
