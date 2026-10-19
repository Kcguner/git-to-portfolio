import localFont from "next/font/local";

/*
 * The display serif, in its own module.
 *
 * Fraunces is set on exactly one thing in this site: the sentence under
 * the name mark on the home page, the one heading that does not carry the
 * `font-sans` utility and therefore falls back to the serif the base layer
 * sets for headings. Every other page sets its headings in the sans.
 *
 * Because the serif is only used on one route, it is loaded from that
 * route's own file rather than from the layout. `next/font` preloads a
 * font on the routes that use it, so the profile pages — the pages this
 * tool actually exists for — never ask for 58 KB of serif they would not
 * draw a single glyph of.
 *
 * It is not preloaded either. A preload is a promise the browser keeps
 * whether the page needs the file or not, and the router prefetches the
 * home route from every profile page, so a preloaded serif would be
 * fetched on the profile pages too. Without the preload the browser asks
 * for the file when the stylesheet that declares it has been parsed, which
 * is a few tens of milliseconds after the page starts — and the
 * metric-adjusted fallback below means the line does not move when it
 * arrives.
 *
 * The same reasoning is why the family keeps a name of its own here: the
 * font stack next/font builds is named after the constant the font is
 * assigned to, and a stack that names a family the `@font-face` does not
 * declare falls through to the system face. `fraunces` is both.
 */

const fraunces = localFont({
  src: [{ path: "./fraunces-latin.woff2", weight: "400 900", style: "normal" }],
  display: "swap",
  // Not preloaded: the serif is used on one heading of one route, and
  // preloading it would make the profile pages pay for 58 KB of a font
  // they never draw a glyph of. The metric-adjusted fallback below keeps
  // the swap from moving the line.
  preload: false,
  // A serif face wants a serif fallback, and Times New Roman is the one
  // the metrics are adjusted against.
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
  variable: "--font-fraunces",
  declarations: [
    { prop: "font-family", value: "fraunces" },
    {
      prop: "unicode-range",
      value:
        "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+0300-0301,U+0303-0304,U+0308,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,U+2212,U+2215",
    },
  ],
});

// The extended half of the family. It is a second @font-face of the same
// family, with the characters the first one does not cover, so the browser
// falls through to it only for those. See the note on the Inter half in
// app/fonts/fonts.ts.
export const frauncesExt = localFont({
  src: [
    { path: "./fraunces-latin-ext.woff2", weight: "400 900", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "fraunces" },
    {
      prop: "unicode-range",
      value:
        "U+0100-0130,U+0132-0148,U+014A-0151,U+0154-017E,U+2020,U+20A1,U+20A3-20A4,U+20A6-20A7,U+20A9,U+20AB,U+20AD,U+20B1-20B2,U+20B5,U+20B9-20BA,U+20BC-20BD",
    },
  ],
});

/**
 * The class name that puts the serif on the document.
 *
 * The variable has to reach the heading that uses the serif, so the class
 * goes on the page's own root element rather than on the `<html>` element
 * the layout owns.
 */
export const frauncesVariable = fraunces.variable;
