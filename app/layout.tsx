import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import DocumentLocale from "@/components/DocumentLocale";
import { LOCALE_TAGS, LOCALES, withLocale } from "@/lib/i18n";
import { getLocaleFromHeaderValue, LOCALE_HEADER } from "@/lib/locale-negotiation";
import { getSiteUrl } from "@/lib/site";
import "./fonts.scss";
import "./globals.css";

const siteUrl = getSiteUrl();
const description =
  "GitHub profilinden otomatik, sade ve yazdırılabilir bir geliştirici portföyü oluştur.";
const localeAlternates = Object.fromEntries(
  LOCALES.map((locale) => [LOCALE_TAGS[locale], `${siteUrl}${withLocale('/', locale)}`])
);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
    languages: localeAlternates,
  },
  title: {
    default: "Git-to-Portfolio",
    template: "%s | Git-to-Portfolio",
  },
  description,
  keywords: ["GitHub portfolyo", "geliştirici CV", "PDF CV", "GitHub profil"],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Git-to-Portfolio",
    title: "Git-to-Portfolio",
    description,
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Git-to-Portfolio",
    description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  colorScheme: "dark",
};

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
  const locale = getLocaleFromHeaderValue((await headers()).get(LOCALE_HEADER));

  return (
    <html lang={locale} className="dark">
      <body className="noise-bg min-h-screen antialiased">
        <div className="fixed inset-0 grid-bg pointer-events-none" aria-hidden="true" />
        <div className="fixed inset-0 glow-top pointer-events-none" aria-hidden="true" />
        <div className="site-shell">{children}</div>
        <Suspense fallback={null}>
          <DocumentLocale />
        </Suspense>
      </body>
    </html>
  );
}
