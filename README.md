# Git-to-Portfolio

Turn any public GitHub profile into a clean, shareable, print-ready developer portfolio. No sign-up, no database, no server-side user data.

**[Live demo](https://git-to-portfolio.vercel.app)** · [Source](https://github.com/Kcguner/git-to-portfolio) · English | [Türkçe](README.tr.md)

Real portfolios you can try right now:

- [`/kcguner`](https://git-to-portfolio.vercel.app/kcguner) — the creator of this site
- [`/torvalds`](https://git-to-portfolio.vercel.app/torvalds) — the creator of Linux

![CI](https://github.com/Kcguner/git-to-portfolio/actions/workflows/ci.yml/badge.svg) ![License: MIT](https://img.shields.io/github/license/Kcguner/git-to-portfolio) ![Next.js 16](https://img.shields.io/badge/Next.js-16.3.6-000000?style=flat-square&logo=next.js) ![Node 20](https://img.shields.io/badge/node-%3E%3D20.9-5FA04E?style=flat-square)

## Features

- Blueprint identity: hairline-bordered sheets, titleblock strips, spec tables, sharp 2px corners, no gradients, no glow, no infinite motion
- Deep-navy night theme by default with a paper-light inversion and a header toggle; the choice is remembered in a cookie and applied server-side
- Public profile with avatar, bio, location, social links and follower/repo counts
- Pinned repositories first, falling back to the starred ranking when there is no token or nothing is pinned
- Featured-language distribution, counted by repository and formatted for the reader's language
- Repository topics as mono annotation chips on each project cell
- Turkish, English, German and Spanish, resolved on the server
- Streamed loading skeleton for the repository block, shaped like the projects it stands in for
- Print-optimized stylesheet with a one-click **Save as PDF** export
- Native Web Share with an accessible clipboard fallback
- Localized Open Graph and Twitter card images, one static image per language and per profile, drawn as blueprint cards
- Per-language titles, descriptions, keywords, hreflang clusters and JSON-LD structured data
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

Six repositories are shown, forks and archived repos excluded. **The repositories the person pinned on their GitHub profile come first**, in the order they chose; only when that list is empty — no `GITHUB_TOKEN`, or nothing pinned — does the page fall back to the most-starred non-fork repositories from the core API. The section heading names which of the two you are looking at, because a list someone chose and a list we ranked are not the same claim.

The language bars count how many of those six repositories use each language — they are not a measurement of lines or bytes of code, and the top three are shown, so the percentages do not necessarily add up to 100. Each share is formatted with `Intl` for the page's language: `60%` in English, `%60` in Turkish, `60 %` in German and Spanish.

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
# Also what enables the pinned-repositories list; without it the page falls
# back to the starred ranking.
GITHUB_TOKEN=github_pat_...
```

All three are read on the server only and are never sent to the browser, so none of them is `NEXT_PUBLIC_`-prefixed. `SITE_URL` and `GITHUB_REPO_URL` both have sensible defaults, so you only need to set them when your domain or repository differs.

**About the token.** Anonymous GitHub requests are limited to 60 per hour and are counted per originating IP address, which on a shared host means your site competes with everyone else on that address. One profile view costs two requests, so the anonymous ceiling is roughly 30 distinct profiles per hour. A token raises this to 5,000 per hour. A fine-grained token needs **no permissions at all** — it can read every public repository on GitHub, which is all this app does. Create one under [Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new), and set it for the Production environment only.

## How It Works

1. `GET /users/:username` loads the public profile.
2. GraphQL `pinnedItems` loads the repositories the person chose, in their order. It needs `GITHUB_TOKEN` — the GraphQL API has no anonymous quota — and answers `null` for any failure, so this step is skipped without a token.
3. `GET /users/:username/repos` is the fallback: forks and archived entries filtered out, ranked locally by stars.
4. Both responses are cached for one hour. The language is carried in the URL, not in a cookie.

The core API is used for the fallback ranking rather than the Search API. Unauthenticated search rejects some public accounts outright with `422 Validation Failed`, which would render a valid profile with no repositories at all, and it is rate limited at 10 requests per minute against the core API's 60 per hour. The trade-off is ranking scope: the core API cannot sort by stars, so the six cards are the most-starred of the user's 100 most recently pushed repositories, which is exact for the large majority of accounts. Raise `DEFAULT_REPO_PAGES` in `lib/github.ts` to widen that window.

## Share and Print

The **Share** action uses the native Web Share API where available and falls back to the Clipboard API, announcing the result in a live region. The message clears itself, lingers longer when it carries a recovery instruction, and can always be dismissed by hand.

The **Print / Save as PDF** action opens the browser print dialog. The print stylesheet drops navigation and controls, repaints the language bars as flat greys so a printer cannot lose them, and forces near-white text to a readable dark colour so repository names do not print as white-on-white.

## Search and Sharing

Every page describes itself to crawlers in the language it is rendered in, and `lib/seo.ts` is the single place that decides how:

- **Canonical and hreflang.** Each page's `canonical` is its own localized URL, and every page carries the full cluster — `tr-TR`, `en-US`, `de-DE`, `es-ES` and `x-default` — as absolute `hreflang` alternates, in the `<head>` and in `sitemap.xml`.
- **Titles, descriptions and keywords.** Localized per language, including a keyword set for each portfolio that contains the person's name, so a search for their name plus "portfolio" can find them in any of the four languages.
- **Structured data.** JSON-LD in the reader's language: the site as `WebSite` and `WebApplication`, the home page's visible three steps as a `HowTo`, and a portfolio as a `ProfilePage` whose subject is a `Person`, with the six displayed repositories as `SoftwareSourceCode` and their languages as `knowsAbout`. Only facts the page shows are emitted, and the entity id is the locale-free URL, so all four languages describe one person rather than four.
- **Social cards.** One image per language, at `/opengraph-image/<locale>` and `/<user>/opengraph-image/<locale>`. The language is a path segment rather than a query parameter because social crawlers fetch the image URL on its own; each language is also a separate cache entry, and the home page cards are prerendered at build time. `og:locale:alternate` tells Facebook, LinkedIn and Slack which card matches the page.
- **Sitemap.** One entry per language per page, each repeating the full hreflang cluster, with no fabricated `lastmod`. The two 404 segments are `noindex` and carry a card in the reader's language.

The language a page is rendered in comes from the URL, not from a cookie, so a crawler that ignores `Accept-Language` and requests `/` always gets the same Turkish document with the same Turkish metadata.

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

- **The project list is streamed, and so is its structured data.** An unknown username answers `404` and a non-canonical login answers `308` because both are decided before the response body starts, which means the repository lookup runs behind a `<Suspense>` boundary of its own. The person, the header and the footer are in the first chunk, with a skeleton in the space the projects will take; the six repositories, the featured languages and the `ProfilePage` data block describing them arrive in the last. A crawler that renders JavaScript sees the finished sheet; a client that stops at the first chunk sees the person without the project list.
- **The theme is not a third state.** The toggle only offers night (the default) and paper. There is no "system" mode, and the first visit always renders the night palette even when the browser asks for light.
- **Rate limiting is the only cache.** There is no API route and no additional caching layer. A token is what keeps a public deployment responsive.
- **The 404 body is hydrated.** The status, the localized `<title>` and the `noindex` metadata are all correct in the initial HTML, but the visible markup arrives through the RSC payload, because `notFound()` works by throwing `NEXT_HTTP_ERROR_FALLBACK;404`.
- **No offline support.** The web app manifest provides installable metadata, but nothing is cached for offline use.

## License

MIT — see [`LICENSE`](LICENSE).
