import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import DocumentLocale from "@/components/DocumentLocale";
import DocumentTheme from "@/components/DocumentTheme";
import JsonLd from "@/components/JsonLd";
import {
  DEFAULT_LOCALE,
  getDictionary,
  isLocale,
  LOCALES,
  type Locale,
} from "@/lib/i18n";
import {
  getAbsoluteLocaleAlternates,
  getHomeOpenGraphImagePath,
  getLocaleAlternatesMetadata,
  getNoIndexMetadata,
  getSiteJsonLd,
  getSocialImageMetadata,
  INDEXABLE_ROBOTS,
  SITE_AUTHOR,
  SITE_NAME,
} from "@/lib/seo";
import { getGitHubRepoUrl, getSiteUrl } from "@/lib/site";
import { THEME_COLORS } from "@/lib/theme";
import { fontVariables } from "../fonts/fonts";
import { THEME_SCRIPT } from "../theme-script";
import "../globals.css";

const siteUrl = getSiteUrl();

// The layout's metadata is the shared fallback for every page below it, and it
// describes the **default locale's home**: it is the only URL in the site that
// is guaranteed to exist in every language, and the pages that have a
// canonical of their own replace this whole object.
const defaultDictionary = getDictionary(DEFAULT_LOCALE);
const description = defaultDictionary.metadata.homeDescription;

type LocaleLayoutProps = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

/**
 * The argument Next.js passes to `generateMetadata`.
 *
 * Next calls the metadata function with the segment's params and nothing
 * else, so the layout's own props type does not describe this call: it
 * carries `children`, which the metadata function never receives and cannot
 * rely on. The type here says what is actually passed.
 *
 * The extra properties of the framework's call shape are tolerated (and
 * ignored) so the argument stays compatible with it.
 */
type LocaleLayoutMetadataProps = {
  params: Promise<{ locale: string }>;
} & Record<string, unknown>;

/**
 * The four languages, prerendered.
 *
 * The root layout lives under a dynamic segment, so Next needs to know the
 * values of that segment to build the four static documents. Every locale the
 * site serves is listed here: `/tr`, `/en`, `/de` and `/es` are four separate
 * pages with four separate URLs, not one page with a query parameter.
 */
export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleLayoutMetadataProps): Promise<Metadata> {
  // The segment's params are resolved so the metadata belongs to the document
  // it is rendered into, but the language itself is deliberately not used for
  // the description: a layout cannot know which page it is wrapping, and the
  // canonical of one page must never be inherited by another. The pages below
  // replace the canonical, the hreflang cluster and the card with their own.
  //
  // What the segment *is* read for is whether it names a language the site
  // serves at all. The body below answers an unsupported one with a 404, so
  // the metadata must not describe the default locale's home under a URL that
  // does not exist.
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    return {
      metadataBase: new URL(siteUrl),
      // The language of the not-found page, which answers an unsupported
      // segment in the default locale.
      ...getNoIndexMetadata(DEFAULT_LOCALE, {
        title: `${defaultDictionary.notFound.pageTitle} | ${SITE_NAME}`,
        description: defaultDictionary.notFound.pageDescription,
      }),
    };
  }

  const alternates = getLocaleAlternatesMetadata("/", DEFAULT_LOCALE);
  const images = getSocialImageMetadata(
    getHomeOpenGraphImagePath(DEFAULT_LOCALE),
    defaultDictionary.metadata.ogImage.alt,
  );

  return {
    metadataBase: new URL(siteUrl),
    // A named, linkable author. On a bare subdomain the site's only off-page
    // identity is its repository, so the authorship is stated in metadata and
    // repeated in the JSON-LD rather than left for a crawler to infer.
    authors: [{ name: SITE_AUTHOR, url: getGitHubRepoUrl() }],
    creator: SITE_AUTHOR,
    alternates: {
      canonical: alternates.canonical,
      // The four language homes, plus `x-default` for the default one.
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
      url: alternates.canonical,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      locale: "tr_TR",
      // Declared explicitly so Next does not inject one `og:image` per generated
      // locale image; routes override this with the card for their own language.
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images,
    },
    robots: INDEXABLE_ROBOTS,
  };
}

/**
 * The browser chrome has to match the page.
 *
 * The `theme-color` is a literal in a meta tag, so it cannot follow the CSS
 * custom property the rest of the palette uses, and reading the theme cookie
 * here would make every page dynamic. The tag therefore carries the default
 * (night) colour, and the inline script below — or the client-side toggle —
 * repaints it the moment the real theme is known.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME_COLORS.dark,
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // The locale is a path segment now, so it is a **build-time** value: the
  // four documents are prerendered, one per language, and the visitor's
  // `Accept-Language` header no longer has a say in it. An unsupported segment
  // is not a page of this site at all.
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  return (
    // `suppressHydrationWarning`: the class on `<html>` is corrected by the
    // inline script below before the first paint, so the server-rendered
    // "dark" and the browser's "light" are expected to differ.
    <html
      lang={locale}
      className={["dark", fontVariables].filter(Boolean).join(" ")}
      suppressHydrationWarning
    >
      <head>
        {/* The theme, applied before the first paint. A plain string constant:
            no request-time value goes into it, so the page stays static. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="noise-bg min-h-screen antialiased">
        {/* The site itself, described once per document in the reader's language.
            A JSON-LD data block is valid in the body and is not executable, so
            the Content-Security-Policy does not apply to it. */}
        <JsonLd data={getSiteJsonLd(locale)} />
        <div className="site-shell">{children}</div>
        {/* Vercel Web Analytics. The `next` entry point is used instead of the
            bare React one so the page view is attributed to the route pattern
            (`/[locale]`, `/[locale]/[username]`) rather than to the raw path,
            which on this site is user-supplied and would otherwise explode the
            cardinality of the dashboard. It renders nothing, so it costs no
            markup. The beacon it posts to /_vercel/insights/view is
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
