import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import DocumentLocale from "@/components/DocumentLocale";
import DocumentTheme from "@/components/DocumentTheme";
import JsonLd from "@/components/JsonLd";
import { DEFAULT_LOCALE, getDictionary } from "@/lib/i18n";
import { getLocaleFromHeaderValue, LOCALE_HEADER } from "@/lib/locale-negotiation";
import {
  getAbsoluteLocaleAlternates,
  getSiteJsonLd,
  INDEXABLE_ROBOTS,
  SITE_NAME,
} from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { THEME_COOKIE, THEME_COLORS, type Theme } from "@/lib/theme";
import "./fonts.scss";
import "./globals.css";

const siteUrl = getSiteUrl();
// The root layout's metadata is static, so it can only describe the default
// locale. Both routes replace it per request with their own localized
// canonical, description, keywords and social card; this is the fallback for
// the 404 segments, which have no page metadata of their own beyond a title.
const defaultDictionary = getDictionary(DEFAULT_LOCALE);
const description = defaultDictionary.metadata.homeDescription;

// The blueprint is drawn for the night shift: only the exact value "light"
// selects the paper palette. Anything else, including a missing or
// hand-edited cookie, falls back to the dark default.
async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === "light" ? "light" : "dark";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
    languages: getAbsoluteLocaleAlternates("/"),
  },
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description,
  keywords: defaultDictionary.metadata.homeKeywords,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description,
    locale: "tr_TR",
    // Declared explicitly so Next does not inject one `og:image` per generated
    // locale image; routes override this with the card for their own language.
    images: ["/opengraph-image/tr"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description,
    images: ["/opengraph-image/tr"],
  },
  robots: INDEXABLE_ROBOTS,
};

// The browser chrome has to match the page, and the page's background follows
// the theme cookie, so the theme-color meta tag is resolved per request. The
// `color-scheme` is deliberately left to CSS: globals.css sets it on the
// <html> theme class, which also covers native controls and scrollbars.
export async function generateViewport(): Promise<Viewport> {
  return {
    width: "device-width",
    initialScale: 1,
    themeColor: THEME_COLORS[await getTheme()],
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proxy resolves the effective locale (explicit ?lang= > Accept-Language >
  // default) and forwards it on the request. Reading it here means the SSR
  // HTML already carries the right <html lang> for screen readers, crawlers
  // and clients without JavaScript. Reading headers makes the layout dynamic,
  // which both routes already were; the metadata routes (robots, sitemap,
  // manifest, opengraph-image) do not render this layout and stay static.
  // The theme is read the same way, so <html> carries the visitor's palette
  // before the first paint instead of flashing the wrong one.
  const [locale, theme] = await Promise.all([
    getLocaleFromHeaderValue((await headers()).get(LOCALE_HEADER)),
    getTheme(),
  ]);

  return (
    <html lang={locale} className={theme}>
      <body className="noise-bg min-h-screen antialiased">
        {/* The site itself, described once per document in the reader's language.
            A JSON-LD data block is valid in the body and is not executable, so
            the Content-Security-Policy does not apply to it. */}
        <JsonLd data={getSiteJsonLd(locale)} />
        <div className="site-shell">{children}</div>
        {/* Vercel Web Analytics. The `next` entry point is used instead of the
            bare React one so the page view is attributed to the route pattern
            (`/`, `/[username]`) rather than to the raw path, which on this site
            is user-supplied and would otherwise explode the cardinality of the
            dashboard. It renders nothing, so it costs no markup.

            The nonce-based policy in proxy.js needs no change here: the package
            injects its script with document.createElement from the Next.js
            client bundle, and that bundle is the nonce'd script, so
            'strict-dynamic' trusts the injected tag even though it carries no
            nonce of its own. The beacon it posts to /_vercel/insights/view is
            same-origin, so 'connect-src self' already covers it. */}
        <Analytics />
        <Suspense fallback={null}>
          <DocumentLocale />
          <DocumentTheme />
        </Suspense>
      </body>
    </html>
  );
}
