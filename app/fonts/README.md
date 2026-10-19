# The web fonts

Six `.woff2` files, self-hosted and loaded through `next/font/local` in
`app/[locale]/layout.tsx`. They replace the `@fontsource` SCSS mixins that
used to live in `app/fonts.scss`.

| File | Family | Weight axis | Bytes | Repertoire |
| --- | --- | --- | ---: | --- |
| `inter-latin.woff2` | Inter | 400–900 | 28 148 | Latin-1, Latin Extended-A (`ı`), punctuation |
| `inter-latin-ext.woff2` | Inter | 400–900 | 15 596 | Latin Extended-A (`ğ İ ş`), currency |
| `jetbrains-mono-latin.woff2` | JetBrains Mono | 400–800 | 31 116 | Latin-1, Latin Extended-A, punctuation |
| `jetbrains-mono-latin-ext.woff2` | JetBrains Mono | 400–800 | 8 728 | Latin Extended-A, currency |
| `fraunces-latin.woff2` | Fraunces | 400–900 | 34 284 | Latin-1, Latin Extended-A, punctuation |
| `fraunces-latin-ext.woff2` | Fraunces | 400–900 | 23 828 | Latin Extended-A, currency |
| | | | **141 700** | |

The old setup emitted 20 `@font-face` rules and the browser pulled 12 of
them — 253 836 bytes — after the stylesheet had parsed, with nothing
preloaded.

## Why the files are cut down like this

* **One variable file per family and subset, not one per weight.** The
  old mixins shipped Inter and JetBrains Mono as four static weights each.
  A variable file covers every weight the site asks for — 400, 500, 600,
  700, 800 and 900 — so `font-black` and `font-extrabold` are real faces
  now instead of weights the browser has to fake by smearing a 700.
* **The weight axis is clipped** to the range the app uses. Nothing in the
  site asks for a weight below 400, so the 100–300 instances of the
  upstream files are dropped.
* **The character repertoire is clipped** to Latin-1 + Latin Extended-A +
  General Punctuation + currency symbols. That covers Turkish (`ı ş ğ İ
  ç ö ü`), German (`ß ä ö ü`), Spanish (`ñ ¿ ¡`) and the Latin text that
  comes back from the GitHub API. The upstream `latin-ext` files carry
  hundreds of glyphs no language on this site can produce.
* **Only the upright style of Fraunces is kept.** The italic of the family
  is 86 KB of file that nothing ever downloads.

## The `unicode-range` split

Each family is two files with **disjoint** `unicode-range` values, so the
browser downloads the extended file only when the page really contains a
character that needs it. An English page never asks for it; a Turkish one
does, because `ş`, `ğ` and `İ` live in the extended range. (`ı` does not:
it is in the latin range, and the browser paints it from the latin file.)

The exact ranges are declared in the `declarations` block of each
`localFont` call in `app/fonts/fonts.ts` and `app/fonts/fraunces.ts`, and
they are the exact coverage of the corresponding file — no more, no less.
`build-fonts.py` prints them and fails the build if the two halves of a
family ever overlap.

Because the ranges are written by hand in two places, they can drift from
the files they describe, and a range that claims a codepoint the file does
not contain renders as tofu. `npm run fonts:check` re-derives each range
from the committed .woff2 and fails when the two disagree; CI runs it.

## What the browser downloads

Measured with a real browser against the production build, counting the
font responses as they arrive:

| Page | Before (`@fontsource`) | Now (`next/font/local`) |
| --- | --- | --- |
| `/tr` | 253 836 B, 12 files, 0 preloads | 141 844 B, 6 files, 6 preloads |
| `/en` | 148 384 B, 7 files, 0 preloads | 141 844 B, 6 files, 6 preloads |

The six files are preloaded, so they are in flight while the stylesheet is
still parsing instead of being discovered after it. The price is that the
three extended files are fetched on every page, even the ones that need no
extended character: `/en` would have been 93 716 B without the preloads.
That is the trade the site takes — the default locale is Turkish, and the
characters that need the extended file are on the first screen.

## Where the fonts are used

`inter` and `jetBrainsMono` are loaded by the locale layout, so every page
of the site has them — preloaded, in the first bytes of the document.

`fraunces` is loaded by the home page alone (see `app/fonts/fraunces.ts`),
because the serif is set on one heading of one route. The profile pages
therefore never fetch it: they download 83 644 bytes of font instead of
141 700.

## Rebuilding

The files are generated from the `@fontsource-variable/*` packages with
[fontTools](https://fonttools.readthedocs.io/):

```sh
pip install fonttools brotli
npm install
python3 app/fonts/build-fonts.py
```

The script is deterministic: the same sources always produce the same
bytes.

`build-fonts.py` is the source of truth for the character set, the weight
ranges and the `unicode-range` values. Run it whenever the design starts
using a character outside the repertoire — a new language, a currency
symbol, a typographic quote — and copy the new ranges into the layout.

The script has a second mode, which builds nothing and only checks:

```sh
npm run fonts:check
```

It re-derives the `unicode-range` of every committed .woff2 from that
file's own character map and compares it with the range declared for the
file. It needs the same toolchain as the rebuild (`pip install fonttools
brotli`), which is why CI installs it: the fonts themselves are committed,
so a machine that only builds the site never needs it.

## Licences

Inter, JetBrains Mono and Fraunces are all under the SIL Open Font
License 1.1. The upstream packages keep the licence files.
