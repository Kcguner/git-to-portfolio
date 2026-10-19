import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The declared `unicode-range` of a font file has to be the range the file
 * actually covers.
 *
 * A `unicode-range` that claims a codepoint the file does not contain is a
 * promise the browser keeps and the font cannot: the browser picks the face
 * that claims the character, asks it for the glyph, and gets nothing back.
 * What the reader sees is tofu.
 *
 * The ranges live in `app/fonts/fonts.ts` and `app/fonts/fraunces.ts`, and
 * they were copied by hand from what `app/fonts/build-fonts.py` prints. Two
 * files and two hand-copied values is exactly the arrangement where the copy
 * drifts from the original, so the check is: re-derive the range from the
 * committed .woff2 and compare it with the declared one.
 *
 * The check itself is the `--check` mode of the build script, because that
 * is the tool that knows how to read a font file. It needs fontTools, which
 * is a Python package and not a dependency of this project — the fonts are
 * committed, so the build never needs it. When fontTools is not installed
 * the check cannot run, and the test says so instead of failing: the fonts
 * are already built and committed, so a machine without the font toolchain
 * has nothing to rebuild.
 */
function hasFontTools(): boolean {
  try {
    execFileSync("python3", ["-c", "import fontTools, brotli"], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

const toolchain = hasFontTools();

describe("the committed fonts", () => {
  it.runIf(toolchain)(
    "declares a unicode-range that matches the file it belongs to",
    () => {
      const script = path.join(process.cwd(), "app", "fonts", "build-fonts.py");

      // The script prints the six files it checked and exits non-zero with a
      // diagnosis when a declared range and the file disagree.
      const output = execFileSync("python3", [script, "--check"], {
        encoding: "utf-8",
      });

      expect(output).toContain("inter-latin.woff2");
      expect(output).toContain("fraunces-latin-ext.woff2");
    },
  );

  it.skipIf(toolchain)(
    "is not checked here because fontTools is not installed",
    () => {
      // The skip is reported rather than hidden: the check runs in CI, where
      // the toolchain is installed.
    },
  );
});
