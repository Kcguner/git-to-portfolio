#!/usr/bin/env python3
"""
Regenerate the web fonts in app/fonts/.

The site used to ship the @fontsource SCSS mixins, which produced 20
@font-face rules for three families and let the browser pull 12 of them
(257 KB) before the first paint. The files in app/fonts/ are the same
typefaces, cut down to what the site can actually render:

  * one variable file per (family, subset) instead of one file per weight,
  * the weight axis clipped to the range the app asks for,
  * the character repertoire clipped to Latin-1 + Latin Extended-A +
    General Punctuation, which covers Turkish, English, German and
    Spanish plus the Latin text that comes out of the GitHub API.

Sources are the @fontsource packages; the subsetting is done with
fontTools (pip install fonttools brotli) and the result is committed, so
the build needs no font tooling.

    python3 app/fonts/build-fonts.py

The script has a second mode, which builds nothing:

    python3 app/fonts/build-fonts.py --check

It re-derives the `unicode-range` of every committed .woff2 from that file's
own character map and compares it with the range declared for the file in
app/fonts/fonts.ts. The two are written by hand in two places, and a range
that claims a codepoint the file does not contain renders as tofu — so the
check is what keeps them in step.
"""
import os
import re
import subprocess
import sys
import tempfile

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
NM = os.path.join(REPO, "node_modules")
# The files that declare a `localFont` face. The three families are split
# over two of them: the two text faces are loaded by every page, so they live
# in fonts.ts, and the serif is loaded by the home page alone, so it lives in
# fraunces.ts.
DECLARING_FILES = ("fonts.ts", "fraunces.ts")

# The character repertoire the site can render.
#   U+0000-U+00FF  Latin-1: ASCII plus c/o/u (tr), a/o/u/ss (de), n/!/? (es)
#   U+0100-U+017F  Latin Extended-A: i-dotless, s-cedilla, g-breve, I-dotted
#   U+0300-U+036F  combining diacritics (decomposed Turkish, Latin accents)
#   U+2000-U+206F  general punctuation: dashes, ellipsis, curly quotes
#   U+20A0-U+20CF  currency symbols, including the Turkish lira sign
#   plus the handful of symbols the design uses.
CHARSET = (
    set(range(0x0000, 0x0100))
    | set(range(0x0100, 0x0180))
    | set(range(0x0300, 0x0370))
    | set(range(0x2000, 0x2070))
    | set(range(0x20A0, 0x20D0))
    | {0x20AC, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x2215, 0xFEFF, 0xFFFD}
)

# family -> (source package, source file prefix, weight axis range)
FAMILIES = [
    ("inter", os.path.join(NM, "@fontsource-variable/inter/files"), "inter", 400, 900),
    ("jetbrains-mono", os.path.join(NM, "@fontsource-variable/jetbrains-mono/files"), "jetbrains-mono", 400, 800),
    ("fraunces", os.path.join(NM, "@fontsource-variable/fraunces/files"), "fraunces", 400, 900),
]

# The subset files ship as <name>-latin-wght-normal.woff2 / -latin-ext-wght-normal.woff2
SOURCE_SUFFIX = {
    "latin": "-latin-wght-normal.woff2",
    "latin-ext": "-latin-ext-wght-normal.woff2",
}


def build(src, dst, lo, hi, keep=None):
    font = TTFont(src)
    font.flavor = None

    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.notdef_outline = True
    options.glyph_names = True
    options.drop_tables = []
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=CHARSET if keep is None else keep)
    sub.subset(font)

    font = instancer.instantiateVariableFont(
        font, {"wght": (float(lo), float(hi))}, inplace=False, updateFontNames=False
    )
    # A fixed timestamp, so the same sources always produce the same bytes.
    # The default is "now", which would make every rebuild a diff.
    font.recalcTimestamp = False
    font["head"].modified = 0
    font["head"].created = 0
    font.flavor = "woff2"
    font.save(dst)
    return font


def unicode_range(codepoints):
    """The exact coverage of a built file, as a CSS unicode-range value."""
    points = sorted(codepoints)
    parts = []
    start = prev = points[0]
    for cp in points[1:]:
        if cp == prev + 1:
            prev = cp
            continue
        parts.append((start, prev))
        start = prev = cp
    parts.append((start, prev))
    out = []
    for a, b in parts:
        out.append(f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}")
    return ",".join(out)


# The `unicode-range` of a file, as declared in fonts.ts.
#
# The declarations live in the `declarations` block of each `localFont` call,
# and the file a call loads is named in its `src`. The two are read from the
# same call, so the check pairs them the way the file does: every `src` path
# in a call, with the `unicode-range` in that same call.
DECLARED_PATH = re.compile(r'path:\s*"\./(?P<name>[^"]+\.woff2)"')
DECLARED_RANGE = re.compile(
    r'prop:\s*"unicode-range",\s*value:\s*"(?P<range>[^"]+)"', re.DOTALL
)


def declared_ranges():
    """The `unicode-range` declared for each file in app/fonts/*.ts."""
    declared = {}
    for filename in DECLARING_FILES:
        with open(os.path.join(HERE, filename), "r", encoding="utf-8") as handle:
            source = handle.read()

        # The calls are the `localFont({ ... })` blocks. Splitting on the call
        # opener keeps each block's `src` and its `declarations` together.
        for block in re.split(r"localFont\(\{", source)[1:]:
            paths = DECLARED_PATH.findall(block)
            ranges = DECLARED_RANGE.findall(block)
            if not paths or not ranges:
                continue
            for name in paths:
                declared[name] = ranges[0]
    return declared


def actual_ranges():
    """The `unicode-range` each committed file actually covers."""
    actual = {}
    for name in sorted(os.listdir(HERE)):
        if not name.endswith(".woff2"):
            continue
        font = TTFont(os.path.join(HERE, name))
        actual[name] = unicode_range(set(font.getBestCmap().keys()))
    return actual


def check():
    """Fail when fonts.ts and the committed files disagree."""
    declared = declared_ranges()
    actual = actual_ranges()

    problems = []
    for name in sorted(set(declared) | set(actual)):
        if name not in declared:
            problems.append(f"{name}: committed but not declared in fonts.ts")
            continue
        if name not in actual:
            problems.append(f"{name}: declared in fonts.ts but the file is missing")
            continue
        if declared[name] != actual[name]:
            problems.append(
                f"{name}: fonts.ts declares a range the file does not cover\n"
                f"  declared: {declared[name]}\n"
                f"  actual:   {actual[name]}"
            )

    if problems:
        sys.exit(
            "the declared unicode-range and the font files disagree:\n\n"
            + "\n".join(f"  {problem}" for problem in problems)
            + "\n\nA range that claims a codepoint the file lacks renders as tofu.\n"
            "Rebuild the fonts with `python3 app/fonts/build-fonts.py` and copy the\n"
            "ranges it prints into app/fonts/fonts.ts."
        )

    for name in sorted(actual):
        print(f"{name:38s} ok")


def main():
    if not os.path.isdir(os.path.join(NM, "@fontsource-variable/inter")):
        sys.exit("run `npm install` first: the @fontsource packages are the source of truth")
    ranges = {}
    for family, folder, prefix, lo, hi in FAMILIES:
        # The two subsets have to end up with *disjoint* coverage. The
        # fontsource latin-ext files carry a few glyphs that belong to the
        # latin file (a space, a capital A), and a unicode-range that
        # overlapped would make the browser pick the extended file for
        # ordinary text and download it on every page.
        latin = build(
            os.path.join(folder, prefix + SOURCE_SUFFIX["latin"]),
            os.path.join(HERE, f"{family}-latin.woff2"),
            lo,
            hi,
        )
        latin_covered = set(latin.getBestCmap().keys())

        ext_src = os.path.join(folder, prefix + SOURCE_SUFFIX["latin-ext"])
        ext = build(
            ext_src,
            os.path.join(HERE, f"{family}-latin-ext.woff2"),
            lo,
            hi,
            keep=CHARSET - latin_covered,
        )
        ext_covered = set(ext.getBestCmap().keys())
        overlap = ext_covered & latin_covered
        if overlap:
            sys.exit(f"{family}: extended subset still overlaps {sorted(overlap)}")

        for name, covered in (
            (f"{family}-latin", latin_covered),
            (f"{family}-latin-ext", ext_covered),
        ):
            ranges[name] = unicode_range(covered)
            print(f"{name + '.woff2':38s} {os.path.getsize(os.path.join(HERE, name + '.woff2')):7d} bytes  wght {lo}-{hi}")

    print()
    for name, value in ranges.items():
        print(f"{name}\n  {value}\n")


if __name__ == "__main__":
    if "--check" in sys.argv[1:]:
        check()
    else:
        main()
