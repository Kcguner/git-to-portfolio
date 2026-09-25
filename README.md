# Git-to-Portfolio

Turn any public GitHub profile into a clean, shareable, print-ready developer portfolio. No sign-up, no database, no server-side user data.

**[Live demo](https://git-to-portfolio.vercel.app)** · [Source](https://github.com/Kcguner/git-to-portfolio) · English | [Türkçe](README.tr.md)

Real portfolios you can try right now:

- [`/kcguner`](https://git-to-portfolio.vercel.app/kcguner) — the creator of this site
- [`/torvalds`](https://git-to-portfolio.vercel.app/torvalds) — the creator of Linux

![CI](https://github.com/Kcguner/git-to-portfolio/actions/workflows/ci.yml/badge.svg) ![License: MIT](https://img.shields.io/github/license/Kcguner/git-to-portfolio) ![Next.js 16](https://img.shields.io/badge/Next.js-16.3.6-000000?style=flat-square&logo=next.js) ![Node 20](https://img.shields.io/badge/node-%3E%3D20.9-5FA04E?style=flat-square)

## Features

- Public profile with avatar, bio, location, social links and follower/repo counts
- Six featured repositories, forks and archived repos excluded
- Featured-language distribution, counted by repository
- Turkish, English, German and Spanish, resolved on the server
- Print-optimized stylesheet with a one-click **Save as PDF** export
- Native Web Share with an accessible clipboard fallback
- Localized Open Graph and Twitter card images, generated per profile
- Installable web app metadata
- One-hour GitHub API revalidation
- Vitest suite with enforced coverage thresholds, TypeScript, ESLint and CI

## Requirements

Node.js 20.9 or newer, npm 10 or newer.

## Quick Start

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

Type a GitHub username, an `@handle`, or a full `https://github.com/username` URL. The input is validated, lowercased and encoded before it navigates.

The first six non-fork, non-archived repositories are shown, ranked by stars. The language bars count how many of those six repositories use each language — they are not a measurement of lines or bytes of code, and the top three are shown, so the percentages do not necessarily add up to 100.

## Languages

Turkish (`tr`) is the default. Use the selector in the header, or add `lang` to any URL:

| Language | Home | Example profile |
| --- | --- | --- |
| English | `/?lang=en` | `/torvalds?lang=en` |
| Deutsch | `/?lang=de` | `/torvalds?lang=de` |
| Español | `/?lang=es` | `/torvalds?lang=es` |

A missing, repeated or unsupported `lang` falls back to Turkish. `proxy.js` resolves the locale once per request — an explicit `?lang=` wins, otherwise the `Accept-Language` header is negotiated, otherwise Turkish is used — and passes it to the layout through an internal request header, so `<html lang>` is correct in the initial HTML rather than only after hydration.

## Environment Variables

```env
# Canonical origin for sharing, metadata, robots.txt and sitemap.xml.
# Absolute HTTPS URL, no trailing slash.
SITE_URL=https://git-to-portfolio.vercel.app

# Source repository shown in the header and footer.
GITHUB_REPO_URL=https://github.com/Kcguner/git-to-portfolio

# Optional, but strongly recommended for any public deployment.
GITHUB_TOKEN=github_pat_...
```

All three are read on the server only and are never sent to the browser, so none of them is `NEXT_PUBLIC_`-prefixed. `SITE_URL` and `GITHUB_REPO_URL` both have sensible defaults, so you only need to set them when your domain or repository differs.

**About the token.** Anonymous GitHub requests are limited to 60 per hour and are counted per originating IP address, which on a shared host means your site competes with everyone else on that address. One profile view costs two requests, so the anonymous ceiling is roughly 30 distinct profiles per hour. A token raises this to 5,000 per hour. A fine-grained token needs **no permissions at all** — it can read every public repository on GitHub, which is all this app does. Create one under [Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new), and set it for the Production environment only.

## How It Works

1. `GET /users/:username` loads the public profile.
2. `GET /users/:username/repos` loads the repositories, forks and archived entries filtered out, ranked locally by stars.
3. Both responses are cached for one hour. The language is carried in the URL, not in a cookie.

The core API is used for repositories rather than the Search API. Unauthenticated search rejects some public accounts outright with `422 Validation Failed`, which would render a valid profile with no repositories at all, and it is rate limited at 10 requests per minute against the core API's 60 per hour. The trade-off is ranking scope: the core API cannot sort by stars, so the six cards are the most-starred of the user's 100 most recently pushed repositories, which is exact for the large majority of accounts. Raise `DEFAULT_REPO_PAGES` in `lib/github.ts` to widen that window.

## Share and Print

The **Share** action uses the native Web Share API where available and falls back to the Clipboard API, announcing the result in a live region. The message clears itself, lingers longer when it carries a recovery instruction, and can always be dismissed by hand.

The **Print / Save as PDF** action opens the browser print dialog. The print stylesheet drops navigation and controls, converts the language bars to flat greys because browsers strip background gradients, and forces near-white text to a readable dark colour so repository names do not print as white-on-white.

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run test:run
npm run test:coverage
npm run build
npm audit --omit=dev
```

Coverage thresholds are enforced in `vitest.config.mts` and fail the run if they drop. CI runs the same gate plus the production dependency audit, on Node.js 20 and 22.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Kcguner/git-to-portfolio.git)

1. Deploy from the button above, or import the repository into Vercel.
2. Add `GITHUB_TOKEN` under Settings → Environment Variables, scoped to Production.
3. Set `SITE_URL` if your production domain differs from the default.

`NEXT_PUBLIC_` values are inlined at build time, so change them before building, not after.

## Tech Stack

Next.js 16 App Router · React 19 · Tailwind CSS 3 · GitHub REST API · Vitest · GitHub Actions

## Topics

`nextjs` `portfolio-generator` `github-api` `open-graph` `print-to-pdf`

## Known Limitations

- **No loading skeleton.** A `loading.tsx` enables streamed rendering, and Next.js returns `200` for streamed responses because the headers are already sent. An unknown username would then answer `200` with only a skeleton, which crawlers treat as a soft 404. Correct status codes win over a loading animation.
- **Rate limiting is the only cache.** There is no API route and no additional caching layer. A token is what keeps a public deployment responsive.
- **The 404 body is hydrated.** The status, the localized `<title>` and the `noindex` metadata are all correct in the initial HTML, but the visible markup arrives through the RSC payload, because `notFound()` works by throwing `NEXT_HTTP_ERROR_FALLBACK;404`.
- **No offline support.** The web app manifest provides installable metadata, but nothing is cached for offline use.

## License

MIT — see [`LICENSE`](LICENSE).
