import type { Metadata } from 'next';
import { DEFAULT_LOCALE, getDictionary } from '@/lib/i18n';
import { SITE_NAME } from '@/lib/seo';
import NotFoundView from '@/components/NotFoundView';
import { fontVariables } from './fonts/fonts';
import { THEME_SCRIPT } from './theme-script';
import './globals.css';

/**
 * The 404 for a URL that matches no route at all.
 *
 * The root layout lives under the `[locale]` segment, so there is no layout
 * above the router's own 404 and Next would fall back to its unstyled built-in
 * page. This file is that fallback: it is rendered outside every layout, which
 * means it has to bring its own `<html>`, its own `<body>` and its own styles.
 *
 * There is no locale to read here — the URL that did not match has no
 * meaningful first segment — so the page is the default language's, which is
 * also the language the rest of the site falls back to.
 */
const dictionary = getDictionary(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: `${dictionary.notFound.pageTitle} | ${SITE_NAME}`,
  description: dictionary.notFound.pageDescription,
  // A 404 is never an indexable document.
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={["dark", fontVariables].filter(Boolean).join(" ")}
      suppressHydrationWarning
    >
      <head>
        {/* The theme, applied before the first paint. The same constant the
            root layout uses, because this page is rendered without it. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="noise-bg min-h-screen antialiased">
        <div className="site-shell">
          <NotFoundView locale={DEFAULT_LOCALE} kind="page" />
        </div>
      </body>
    </html>
  );
}
