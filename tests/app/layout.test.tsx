import { beforeEach, describe, expect, it, vi } from "vitest";

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headerMocks.headers,
  cookies: headerMocks.cookies,
}));

import RootLayout, {
  generateViewport,
  metadata as rootMetadata,
} from "../../app/layout";
import { LOCALES, LOCALE_TAGS } from "../../lib/i18n";
import { SITE_AUTHOR } from "../../lib/seo";

function setLocaleHeader(value: string | null) {
  headerMocks.headers.mockResolvedValue({
    get: (name: string) => (name === "x-site-locale" ? value : null),
  });
}

function setThemeCookie(value: string | null) {
  // The shape `cookies()` resolves to is narrower than a Map: a `get` that
  // answers with the stored cookie, and nothing else is used here.
  headerMocks.cookies.mockResolvedValue({
    get: (name: string) => (name === "theme" && value ? { value } : undefined),
  });
}

async function renderLayout() {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(await RootLayout({ children: null }));
}

function readHtmlClass(html: string): string | undefined {
  return html.match(/<html[^>]*class="([^"]*)"/)?.[1];
}

function readJsonLd(html: string): { '@graph': Array<Record<string, unknown>> } {
  const [, payload] =
    html.match(/<script type="application\/ld\+json">(.*?)<\/script>/) ?? [];
  return JSON.parse((payload ?? "").replace(/\\u003c/g, "<"));
}

describe("root layout", () => {
  beforeEach(() => {
    headerMocks.headers.mockReset();
    headerMocks.cookies.mockReset();
    setLocaleHeader(null);
    setThemeCookie(null);
  });

  it("describes the site in the language of the request", async () => {
    for (const locale of LOCALES) {
      setLocaleHeader(locale);
      const graph = readJsonLd(await renderLayout())["@graph"];

      // The site, not the page: one WebSite and one WebApplication, and both
      // carry the language a reader actually asked for.
      expect(graph.map((node) => node["@type"])).toEqual(["WebSite", "WebApplication"]);
      for (const node of graph) {
        expect(node.inLanguage).toBe(LOCALE_TAGS[locale]);
      }
    }
  });

  it("falls back to Turkish when the locale header is unusable", async () => {
    setLocaleHeader("xx");
    const graph = readJsonLd(await renderLayout())["@graph"];

    expect(graph[0]?.inLanguage).toBe("tr-TR");
  });

  it("keeps the static fallback metadata in the default language", () => {
    // The layout's `metadata` export cannot read the request, so it describes
    // Turkish and the two routes replace it per language.
    expect(rootMetadata.description).toBe(
      "GitHub kullanıcı adını gir, Git to Portfolio ile saniyeler içinde sade, yazdırılabilir bir geliştirici portföyü oluştur. Ücretsiz, kurulum yok, hesap yok.",
    );
    expect(rootMetadata.keywords).toEqual(expect.arrayContaining(["GitHub portföy"]));
    // The product is attributable: a named author that links to the source.
    expect(rootMetadata.authors).toEqual([
      { name: SITE_AUTHOR, url: "https://github.com/Kcguner/git-to-portfolio" },
    ]);
    expect(rootMetadata.creator).toBe(SITE_AUTHOR);
    expect(rootMetadata.alternates?.canonical).toBe("https://git-to-portfolio.vercel.app");
    expect(Object.keys(rootMetadata.alternates?.languages ?? {})).toEqual([
      ...LOCALES.map((locale) => LOCALE_TAGS[locale]),
      "x-default",
    ]);
    expect(rootMetadata.openGraph?.images).toEqual(["/opengraph-image/tr"]);
    expect(rootMetadata.twitter?.images).toEqual(["/opengraph-image/tr"]);
  });

  it("renders the night theme by default", async () => {
    // No cookie at all, and then a value the server does not recognise: neither
    // may switch the palette away from the default the design is drawn for.
    expect(readHtmlClass(await renderLayout())).toBe("dark");

    setThemeCookie("neon");
    expect(readHtmlClass(await renderLayout())).toBe("dark");
  });

  it("renders the paper theme from the theme cookie", async () => {
    setThemeCookie("light");

    expect(readHtmlClass(await renderLayout())).toBe("light");
  });

  it("keeps the html class independent of the resolved locale", async () => {
    for (const locale of LOCALES) {
      setLocaleHeader(locale);
      setThemeCookie("dark");
      const html = await renderLayout();

      // The theme must not bleed into lang, or the other way round.
      expect(html).toContain(`<html lang="${locale}" class="dark">`);
    }
  });

  it("matches the theme-color meta tag to the theme", async () => {
    // The viewport is resolved per request from the same cookie as the class,
    // otherwise the browser chrome would show the wrong palette for a year.
    expect((await generateViewport()).themeColor).toBe("#0a1628");

    setThemeCookie("light");
    expect((await generateViewport()).themeColor).toBe("#f4f6f9");
  });
});
