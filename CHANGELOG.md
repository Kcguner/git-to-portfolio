# Changelog

All notable changes to Git-to-Portfolio are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic versioning.

## [Unreleased]

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
- License selection remains an explicit owner decision; no license terms were introduced.
