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
- Responsive and print-friendly localization
- Dynamic Open Graph and Twitter share images
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

## Environment Variables

```env
# Public canonical origin used by metadata, robots.txt and sitemap.xml
NEXT_PUBLIC_SITE_URL=https://git-to-portfolio.vercel.app

# Public source repository URL; defaults to Kcguner/git-to-portfolio
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/Kcguner/git-to-portfolio

# Recommended for public deployments to avoid the anonymous GitHub quota
GITHUB_TOKEN=github_pat_...
```

`GITHUB_TOKEN` is read only on the server. Use a fine-grained token with no private-repository access and rotate it immediately if it is exposed.

## How It Works

1. `GET /users/:username` loads the public profile.
2. GitHub Search API loads the first 100 repositories with:
   - `user:<username>`
   - `fork:false`
   - `archived:false`
   - sorted by stars
3. The first six repositories are displayed.
4. Language percentages represent repository counts within those featured repositories; they are not source-code byte or line percentages.
5. GitHub API requests are cached with one-hour revalidation; language selection is carried in the URL query.

## Username Input

The form accepts:

- `torvalds`
- `@torvalds`
- `https://github.com/torvalds`

Usernames are validated, lowercased and encoded before navigation.

## Print or Save as PDF

Every portfolio page has a **Print / Save as PDF** button:

- Opens the browser print dialog with `window.print()`.
- Hides navigation and action controls in print media.
- Uses light print colors and avoids breaking cards across pages.
- In the browser print dialog, choose **Save as PDF** to export the portfolio.

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run test:run
npm run test:coverage
npm run build
npm audit --omit=dev
```

GitHub Actions runs typecheck, lint, tests, the production dependency audit and a production build on Node.js 20 and 22.

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
