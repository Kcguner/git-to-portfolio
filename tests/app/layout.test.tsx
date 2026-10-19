import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound,
}));

import LocaleLayout, {
  generateMetadata,
  generateStaticParams,
  viewport,
} from "../../app/[locale]/layout";
import { THEME_SCRIPT } from "../../app/theme-script";
import { LOCALES, LOCALE_TAGS } from "../../lib/i18n";
import { SITE_AUTHOR } from "../../lib/seo";
import { THEME_COLORS } from "../../lib/theme";

/** The params of a localized document. */
function localeParams(locale: string) {
  return Promise.resolve({ locale });
}

async function renderLayout(locale: string) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(
    await LocaleLayout({ children: null, params: localeParams(locale) }),
  );
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
    navigationMocks.notFound.mockClear();
  });

  it("describes the site in the language of the path segment", async () => {
    for (const locale of LOCALES) {
      const html = await renderLayout(locale);
      const graph = readJsonLd(html)["@graph"];

      // The site, not the page: one WebSite and one WebApplication, and both
      // carry the language of the document they are rendered into.
      expect(graph.map((node) => node["@type"])).toEqual(["WebSite", "WebApplication"]);
      for (const node of graph) {
        expect(node.inLanguage).toBe(LOCALE_TAGS[locale]);
        // The site lives under the locale's own path.
        expect(node.url).toBe(`https://git-to-portfolio.vercel.app/${locale}`);
      }

      // The document says the same thing in its `lang` attribute.
      expect(html).toContain(`<html lang="${locale}"`);
    }
  });

  it("answers an unsupported locale segment with a not-found", async () => {
    // The segment is a build-time value now, so a language the site does not
    // serve is not a page of this site at all.
    await expect(renderLayout("xx")).rejects.toThrow("NEXT_NOT_FOUND");

    expect(navigationMocks.notFound).toHaveBeenCalledOnce();
  });

  it("prerenders the four locales it serves", async () => {
    // The root layout lives under a dynamic segment, so the four documents
    // have to be named for the build.
    expect(await generateStaticParams()).toEqual([
      { locale: "tr" },
      { locale: "en" },
      { locale: "de" },
      { locale: "es" },
    ]);
  });

  it("keeps the shared fallback metadata in the default language", async () => {
    // The layout's metadata is the fallback for every page below it, and it
    // describes the default locale's home: the only URL that is guaranteed to
    // exist in every language. The pages below replace it per language.
    const metadata = await generateMetadata({
      params: localeParams("tr"),
      children: null,
    });

    expect(metadata.description).toBe(
      "GitHub kullanıcı adını gir, Git to Portfolio ile saniyeler içinde sade, yazdırılabilir bir geliştirici portföyü oluştur. Ücretsiz, kurulum yok, hesap yok.",
    );
    expect(metadata.keywords).toEqual(expect.arrayContaining(["GitHub portföy"]));
    // The product is attributable: a named author that links to the source.
    expect(metadata.authors).toEqual([
      { name: SITE_AUTHOR, url: "https://github.com/Kcguner/git-to-portfolio" },
    ]);
    expect(metadata.creator).toBe(SITE_AUTHOR);
    expect(metadata.alternates?.canonical).toBe("https://git-to-portfolio.vercel.app/tr");
    expect(metadata.alternates?.languages).toEqual({
      "tr-TR": "https://git-to-portfolio.vercel.app/tr",
      "en-US": "https://git-to-portfolio.vercel.app/en",
      "de-DE": "https://git-to-portfolio.vercel.app/de",
      "es-ES": "https://git-to-portfolio.vercel.app/es",
      "x-default": "https://git-to-portfolio.vercel.app/tr",
    });
    // One card, the one of the default locale's home, addressed by path.
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://git-to-portfolio.vercel.app/tr/opengraph-image/tr",
        alt: expect.any(String),
        type: "image/png",
        width: 1200,
        height: 630,
      },
    ]);
    expect(metadata.twitter?.images).toEqual(metadata.openGraph?.images);
  });

  it("renders the night theme and applies the real one in the browser", async () => {
    const html = await renderLayout("en");

    // The server always renders the default palette: the document is static,
    // so it cannot read the theme cookie. The two font classes follow it:
    // the families that every page uses have to be on the document before
    // the text is painted. The display serif is the third family, and it
    // belongs to the home page alone, so it is not one of them.
    const classNames = (readHtmlClass(html) ?? "").split(" ");
    expect(classNames[0]).toBe("dark");
    expect(classNames).toHaveLength(3);

    // The theme is applied before the first paint by an inline script, and the
    // script is the shared constant, so it cannot drift from the toggle's.
    expect(html).toContain(THEME_SCRIPT);
    expect(html).toContain('name="theme-color"');
    // The cookie the script reads is the one the toggle writes.
    expect(THEME_SCRIPT).toContain('"theme"');
  });

  it("keeps the html class independent of the resolved locale", async () => {
    for (const locale of LOCALES) {
      const html = await renderLayout(locale);

      // The theme must not bleed into lang, or the other way round. The font
      // classes are on the document as well, so the class list is longer than
      // the theme class alone.
      expect(html).toMatch(
        new RegExp(`<html lang="${locale}" class="dark \\S+ \\S+"`),
      );
    }
  });

  it("declares a static viewport with the night chrome colour", () => {
    // The viewport is a literal now: a request-time one would make every
    // document dynamic. The inline script repaints the tag once the real
    // theme is known.
    expect(viewport).toEqual({
      width: "device-width",
      initialScale: 1,
      themeColor: THEME_COLORS.dark,
    });
    expect(viewport.themeColor).toBe("#0a1628");
  });
});
