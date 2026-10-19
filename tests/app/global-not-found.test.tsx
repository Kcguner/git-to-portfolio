import { describe, expect, it } from "vitest";

import GlobalNotFound, { metadata } from "../../app/global-not-found";
import { THEME_SCRIPT } from "../../app/theme-script";

/**
 * The 404 for a URL that matches no route at all.
 *
 * The root layout lives under the `[locale]` segment, so this page is rendered
 * outside every layout: it brings its own `<html>`, its own theme script and
 * its own copy, because there is no locale segment in a URL that matched
 * nothing.
 */
describe("global not-found", () => {
  it("renders the default language's 404 as a whole document", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const html = renderToStaticMarkup(<GlobalNotFound />);

    // The document says which language it is in, and it says it in the
    // attribute a screen reader announces. The theme class is on the html
    // element, and the font classes follow it.
    expect(html).toContain('<html lang="tr" class="dark ');
    expect(html).toContain("Aradığın sayfa yok");
    expect(html).toContain("<h1");
    // The theme script is carried along, because no root layout wraps this
    // page to apply the theme.
    expect(html).toContain(THEME_SCRIPT);
    // The way home is the default locale's home, not the bare root.
    expect(html).toContain('href="/tr"');
  });

  it("keeps itself out of the index", () => {
    expect(metadata.title).toBe("Aradığın sayfa yok | Git-to-Portfolio");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
