import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The client boundary, asserted on the source.
 *
 * The dictionary used to live in one module that every `'use client'`
 * component imported, so the browser downloaded four languages to render one.
 * The copy now stays on the server: the client modules take their strings as
 * props, and the only dictionary they may import is the tiny error slice.
 *
 * A build error would catch a client module that reaches for the barrel, but
 * only for the modules that are actually rendered. This test covers every
 * client module in the app, including the ones a page may not use yet.
 */
const CLIENT_MODULES = [
  "app/[locale]/error.tsx",
  "components/DocumentLocale.tsx",
  "components/DocumentTheme.tsx",
  "components/LocaleSwitcher.tsx",
  "components/PrintButtonClient.tsx",
  "components/SearchFormClient.tsx",
  "components/ShareButtonClient.tsx",
  "components/ThemeToggle.tsx",
];

/** The one module a client component may import for copy: the error slice. */
const CLIENT_COPY_MODULE = "@/lib/i18n/error";

/**
 * The i18n modules that carry `import 'server-only'`: the barrel, the
 * dictionary index and the four language files. A client module that reaches
 * any of them fails the build.
 */
const SERVER_ONLY_I18N_MODULES = [
  "@/lib/i18n",
  "@/lib/i18n/dictionaries",
  "@/lib/i18n/tr",
  "@/lib/i18n/en",
  "@/lib/i18n/de",
  "@/lib/i18n/es",
  "../lib/i18n",
  "../lib/i18n/dictionaries",
  "../lib/i18n/tr",
  "../lib/i18n/en",
  "../lib/i18n/de",
  "../lib/i18n/es",
];

function readSource(file: string): string {
  return readFileSync(path.resolve(process.cwd(), file), "utf8");
}

describe("the client boundary", () => {
  it("keeps the dictionary barrel out of every client module", () => {
    for (const file of CLIENT_MODULES) {
      const source = readSource(file);

      // `@/lib/i18n` is the server-only barrel: it reaches all four
      // dictionaries, so a client module that imports it fails the build.
      // The same goes for the modules behind it, so the whole server-only
      // family is refused here rather than the barrel alone.
      for (const forbidden of SERVER_ONLY_I18N_MODULES) {
        expect(source, file).not.toMatch(
          new RegExp(`from\\s+['"]${forbidden.replace(/\//g, "\\/")}['"]`)
        );
      }
    }
  });

  it("lets a client module read copy only from the error slice", () => {
    const source = readSource("app/[locale]/error.tsx");

    expect(source).toContain(`from '${CLIENT_COPY_MODULE}'`);
  });

  it("keeps the server-only root parameter out of the client modules", () => {
    // `next/root-params` is a server-only module: importing it from a Client
    // Component is a build error. The error boundary reads the locale from the
    // router state instead, so it must never reach for the root parameter.
    const source = readSource("app/[locale]/error.tsx");

    expect(source).not.toMatch(/import[^;]*next\/root-params/);
    expect(source).toContain("useParams");
  });

  it("marks the dictionary barrel as server-only", () => {
    // The marker is the guarantee: Next.js turns a client import of this
    // module into a build error instead of shipping the copy.
    expect(readSource("lib/i18n.ts")).toContain("import 'server-only'");
    expect(readSource("lib/i18n/dictionaries.ts")).toContain("import 'server-only'");
  });

  it("keeps the language dictionaries in their own modules", () => {
    for (const locale of ["tr", "en", "de", "es"]) {
      const source = readSource(`lib/i18n/${locale}.ts`);

      expect(source, locale).toContain("import 'server-only'");
      // A language module holds one language and nothing else.
      expect(source, locale).not.toMatch(/from '\.\/tr'|from '\.\/en'|from '\.\/de'|from '\.\/es'/);
    }
  });
});
