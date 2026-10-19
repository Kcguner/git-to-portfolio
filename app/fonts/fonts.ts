import localFont from "next/font/local";

/*
 * The two families every page of the site sets its text in.
 *
 * They used to be loaded through the @fontsource SCSS mixins, which emit
 * plain @font-face rules: the browser only found the font files after the
 * stylesheet had parsed, nothing was preloaded, and the first paint fell
 * back to a system face and then swapped — a flash and a layout shift on
 * the largest text on the page.
 *
 * `next/font/local` fixes all three at once. It emits the @font-face rules
 * with the fonts already in the build output, adds a
 * `<link rel="preload" as="font">` for every file, and derives a fallback
 * face whose metrics are adjusted to match the webfont, so the fallback and
 * the webfont occupy the same space and the swap moves nothing.
 *
 * Each family is split into two files — the "latin" repertoire and the
 * "latin-ext" one — and each split file gets its own `unicode-range`, so
 * the browser downloads the extended file only when the page actually
 * contains a character that needs it. The two ranges are disjoint, so the
 * order the rules appear in does not matter.
 *
 * `font-family` is declared explicitly in every `declarations` block: the
 * two halves of a family have to share one family name for the browser to
 * treat them as two subsets of the same typeface instead of two different
 * typefaces.
 *
 * The declared name has to be **the name of the constant the font is
 * assigned to** (`inter`, `jetBrainsMono`). The font stack next/font builds
 * — the one the CSS variable ends up holding — names the family after that
 * constant, and a stack that names a family the `@font-face` does not
 * declare is a stack that silently falls through to the system face: the
 * font is downloaded and never used. Keeping the two in step is why the
 * constants below are lower case and why the mono family is
 * `jetBrainsMono` rather than `JetBrains Mono`.
 *
 * The files themselves are in app/fonts/; app/fonts/README.md documents
 * where they came from and how to rebuild them.
 */

const inter = localFont({
  src: [{ path: "./inter-latin.woff2", weight: "400 900", style: "normal" }],
  display: "swap",
  preload: true,
  // Arial is the metric reference next/font adjusts against, and the
  // grotesk it stands in for is the closest thing on a system without the
  // webfont. The adjusted face keeps the line box the same height, so the
  // swap does not move the text.
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "sans-serif"],
  variable: "--font-inter",
  declarations: [
    { prop: "font-family", value: "inter" },
    {
      prop: "unicode-range",
      value:
        "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+2002,U+2009,U+200B,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,U+2191,U+2193,U+2212,U+FEFF",
    },
  ],
});

// The extended half of the family. A `localFont` call has to be assigned
// to a constant in the module scope, and the constant is what the font
// stack is named after, so this one is exported rather than thrown away.
// It is a second @font-face of the family above, with the characters the
// first one does not cover, so the browser falls through to it only for
// those.
export const interExt = localFont({
  src: [{ path: "./inter-latin-ext.woff2", weight: "400 900", style: "normal" }],
  display: "swap",
  preload: true,
  // The extended half carries no variable of its own: it is a second
  // @font-face of the family above, and a second adjusted fallback would
  // only fight the first one over the same family name.
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "inter" },
    {
      prop: "unicode-range",
      value:
        "U+0100-0130,U+0132-0148,U+014A-0151,U+0154-017F,U+2020,U+20A0-20AB,U+20AD-20BF",
    },
  ],
});

const jetBrainsMono = localFont({
  src: [
    { path: "./jetbrains-mono-latin.woff2", weight: "400 800", style: "normal" },
  ],
  display: "swap",
  preload: true,
  // A monospace face must not fall back to a proportional one: the
  // adjusted Arial fallback would reflow every label the moment the real
  // font arrived. The system's own monospace stands in instead — it has
  // the same advance width behaviour, so only the glyph shapes change.
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  variable: "--font-jetbrains-mono",
  declarations: [
    { prop: "font-family", value: "jetBrainsMono" },
    {
      prop: "unicode-range",
      value:
        "U+000D,U+0020-007E,U+00A0-00FF,U+0102,U+0131,U+0152-0153,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF",
    },
  ],
});

// The extended half of the mono family. See the note on the Inter half.
export const jetBrainsMonoExt = localFont({
  src: [
    {
      path: "./jetbrains-mono-latin-ext.woff2",
      weight: "400 800",
      style: "normal",
    },
  ],
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "jetBrainsMono" },
    {
      prop: "unicode-range",
      value:
        "U+0100-0101,U+0103-0130,U+0134-0151,U+0154-017F,U+2020,U+20AB,U+20AE,U+20BD,U+20BF",
    },
  ],
});

/**
 * The class names that put the two families every page uses on the
 * document.
 *
 * `next/font` turns each family into a CSS variable that holds the
 * webfont, the metric-adjusted fallback it derives from it and the
 * system's own faces behind that. The stylesheet refers to the variables
 * (see tailwind.config.ts and app/globals.css), so the classes have to be
 * on an element above the text — the `<html>` element.
 *
 * The third family, the display serif, is not here: it is used on the home
 * page only, and lives in app/fonts/fraunces.ts.
 */
export const fontVariables = [inter.variable, jetBrainsMono.variable]
  .filter(Boolean)
  .join(" ");
