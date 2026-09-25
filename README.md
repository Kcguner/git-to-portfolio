# Git-to-Portfolio

Turn any public GitHub profile into a clean, shareable developer portfolio. No sign-up and no database.

**Demo:** https://git-to-portfolio.vercel.app  
**Source:** https://github.com/Kcguner/git-to-portfolio

Try it live:

- https://git-to-portfolio.vercel.app/torvalds
- https://git-to-portfolio.vercel.app/gaearon
- https://git-to-portfolio.vercel.app/yyx990803

## Features

- Public GitHub profile, avatar, bio, location and social links
- Top non-fork, non-archived repositories sorted by stars
- Repository-count-based language distribution for featured repositories
- Turkish (default), English, German and Spanish interface
- Responsive, print-friendly localization
- Native Web Share support with an accessible clipboard fallback
- Language-independent dynamic Open Graph and Twitter share images
- Installable web app metadata generated from a Next.js manifest
- Locale-aware pages with one-hour GitHub API data revalidation
- Search API and profile input normalization
- Vitest, TypeScript, ESLint and GitHub Actions CI

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer

## Getting Started

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Languages

Turkish (`tr`) is the default. Use the language selector in the header or add a `lang` query parameter to any route:

- English: `/?lang=en` or `/torvalds?lang=en`
- Deutsch: `/?lang=de` or `/torvalds?lang=de`
- Español: `/?lang=es` or `/torvalds?lang=es`

Profile navigation and links keep the selected language. Missing, repeated or unsupported `lang` values safely fall back to Turkish.

The root layout renders the correct `<html lang>` on the server, so the language is right before hydration and not only after it. `proxy.js` resolves the locale once per request — an explicit `?lang=` wins, otherwise the `Accept-Language` header is negotiated against the supported locales, otherwise Turkish is used — and forwards the result to the layout through an internal request header. Because a root layout cannot read `searchParams`, `DocumentLocale` also corrects the attribute after client-side navigation, which renders RSC payloads without re-rendering the layout.

## Environment Variables

```env
# Public canonical origin used by sharing, metadata, robots.txt and sitemap.xml
# Use an absolute HTTPS URL without a trailing slash.
NEXT_PUBLIC_SITE_URL=https://git-to-portfolio.vercel.app

# Public source repository URL; defaults to Kcguner/git-to-portfolio
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/Kcguner/git-to-portfolio

# Recommended for public deployments to avoid the anonymous GitHub quota
GITHUB_TOKEN=github_pat_...
```

`GITHUB_TOKEN` is read only on the server. Use a fine-grained token with no private-repository access and rotate it immediately if it is exposed.

## How It Works

1. `GET /users/:username` loads the public profile.
2. GitHub Search API loads the repositories for that user with:
   - `user:<username>`
   - `fork:false`
   - `archived:false`
   - sorted by stars
3. The first six repositories are displayed. Only as many repositories as are displayed are requested, so the search response stays as small as the page needs.
4. Language percentages represent repository counts within those featured repositories; they are not source-code byte or line percentages.
5. GitHub API requests are cached with one-hour revalidation; language selection is carried in the URL query.
6. Profile actions use the canonical, locale-aware portfolio URL without tracking or debug parameters.

A failing repository lookup does not take the profile down. The Search API is rate limited far more aggressively than the profile endpoint, so the page still renders the profile card, the language block and an empty repository state, and logs the failure once with the short GitHub error code. Only a missing user is turned into a 404; every other upstream failure reaches the error boundary rather than being disguised as a missing profile.

## Username Input

The form accepts:

- `torvalds`
- `@torvalds`
- `https://github.com/torvalds`

Usernames are validated, lowercased and encoded before navigation.

## Share a Portfolio

Every profile includes a localized **Share** action:

- Uses the browser's native Web Share API when it is available.
- Falls back to the Clipboard API and copies the canonical localized profile URL.
- Announces success and clipboard failures with accessible live feedback.
- Success messages clear automatically after a few seconds, error messages linger longer because they carry a recovery instruction, and a close control always dismisses the toast by hand.
- Hides the action and its feedback from print output.

Profile Open Graph images intentionally use one language-independent design at a stable `/:username/opengraph-image` URL. This keeps social metadata valid even though image metadata routes do not receive the page's locale query parameters.

## Print or Save as PDF

Every portfolio page has a **Print / Save as PDF** button:

- Opens the browser print dialog with `window.print()`.
- Hides navigation and action controls in print media.
- Uses light print colors and avoids breaking cards across pages.
- Renders the featured-language bars as flat greys with borders, because browsers strip background gradients by default when printing. The numeric percentage stays visible next to each bar, so the breakdown is still readable without colour.
- Keeps accent-coloured text and the primary button legible on white instead of printing them as white-on-white.
- In the browser print dialog, choose **Save as PDF** to export the portfolio.

## Web App Manifest

`app/manifest.ts` generates `/manifest.webmanifest` with the site name, launch URL, display mode, dark theme colors and the existing SVG app icon. Next.js automatically connects the manifest to the document; no manual `<link rel="manifest">` tag is needed.

The manifest provides installable-app metadata, but the portfolio itself does not currently provide offline caching or background synchronization.

## Quality Checks

Run the focused share-action tests while developing that component:

```bash
npm run test:run -- tests/components/share-button.test.tsx
```

Run the complete quality gate:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run test:coverage
npm run build
npm audit --omit=dev
```

GitHub Actions runs typecheck, lint, tests, the production dependency audit and a production build on Node.js 20 and 22.

## License

[MIT](LICENSE) © 2026 Kcguner. See [`LICENSE`](LICENSE) for the full terms.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Kcguner/git-to-portfolio.git)

1. Open the Vercel deployment button or import this repository manually.
2. Add the environment variables documented above.
3. Deploy with `npm run build` and start with `npm run start`.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 3
- GitHub REST and Search APIs
- Vitest
- GitHub Actions

## Topics

`nextjs`, `portfolio-generator`, `github-api`, `open-graph`, `print-to-pdf`

## Known Limitations

- The portfolio pages have no loading skeleton. A `loading.tsx` would enable streamed rendering, which commits the HTTP status before the page resolves: an unknown username would then answer `200` with only a skeleton instead of a real `404`. Correct status codes on the primary route win over a loading animation.
- There is no `Accept: application/json` API route and no server-side caching layer of its own, so the GitHub quota is the only cache. Set `GITHUB_TOKEN` for public deployments.
- The not-found UI is a client component, so the 404 response body is hydrated on the client. The HTTP status and the `<title>` are correct in the initial HTML; the visible markup arrives after hydration.
- The `<html lang>` attribute is only re-resolved for hard navigations. The client corrects it after in-app navigation, but the server-rendered value of a client-side route change is never re-emitted.
