import { fileURLToPath } from "node:url";
import path from "node:path";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.d.ts",
        "app/**/icon.*",
        "app/**/opengraph-image.tsx",
        "app/**/not-found.tsx",
        // The root layout lives under the `[locale]` segment now, so the
        // exclusion has to match every layout, not one exact path.
        "app/**/layout.tsx",
        "app/**/template.tsx",
        "app/**/route.ts",
        "node_modules/**",
        ".next/**",
      ],
      thresholds: {
        statements: 80,
        branches: 85,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir),
      // Next.js handles `import 'server-only'` itself and the package is not
      // installed, so the test run needs a stand-in that behaves like the
      // server-side empty module. Next.js ships that empty module with its own
      // Jest mocks, so the repo points at the framework's file rather than
      // keeping a second copy of it in step by hand.
      "server-only": path.resolve(
        rootDir,
        "node_modules/next/dist/build/jest/__mocks__/empty.js"
      ),
      // `next/root-params` is a placeholder that throws outside a real Next
      // request, so the not-found pages cannot even be imported by a test
      // without it. The alias points at a small mock whose `locale` getter the
      // test controls.
      "next/root-params": path.resolve(
        rootDir,
        "tests/mocks/next-root-params.ts"
      ),
    },
  },
});
