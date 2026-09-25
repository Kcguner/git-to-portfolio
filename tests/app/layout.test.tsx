import { beforeEach, describe, expect, it, vi } from "vitest";

const headerMocks = vi.hoisted(() => ({ headers: vi.fn() }));

vi.mock("next/headers", () => ({ headers: headerMocks.headers }));

import RootLayout, { metadata as rootMetadata } from "../../app/layout";
import { LOCALES, LOCALE_TAGS } from "../../lib/i18n";

function setLocaleHeader(value: string | null) {
  headerMocks.headers.mockResolvedValue({
    get: (name: string) => (name === "x-site-locale" ? value : null),
  });
}

async function renderLayout() {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(await RootLayout({ children: null }));
}

function readJsonLd(html: string): { '@graph': Array<Record<string, unknown>> } {
  const [, payload] =
    html.match(/<script type="application\/ld\+json">(.*?)<\/script>/) ?? [];
  return JSON.parse((payload ?? "").replace(/\\u003c/g, "<"));
}

describe("root layout", () => {
  beforeEach(() => {
    headerMocks.headers.mockReset();
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
      "GitHub profilinden otomatik, sade ve yazdırılabilir bir geliştirici portföyü oluştur.",
    );
    expect(rootMetadata.keywords).toEqual(expect.arrayContaining(["GitHub portföy"]));
    expect(rootMetadata.alternates?.canonical).toBe("https://git-to-portfolio.vercel.app");
    expect(Object.keys(rootMetadata.alternates?.languages ?? {})).toEqual([
      ...LOCALES.map((locale) => LOCALE_TAGS[locale]),
      "x-default",
    ]);
    expect(rootMetadata.openGraph?.images).toEqual(["/opengraph-image/tr"]);
    expect(rootMetadata.twitter?.images).toEqual(["/opengraph-image/tr"]);
  });
});
