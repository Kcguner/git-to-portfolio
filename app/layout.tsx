import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import DocumentLocale from "@/components/DocumentLocale";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const siteUrl = getSiteUrl();
const description =
  "GitHub profilinden otomatik, sade ve yazdırılabilir bir geliştirici portföyü oluştur.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/index.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.0/index.min.css"
        />
      </head>
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
