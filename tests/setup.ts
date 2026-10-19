import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * `next/font/local` is a build-time transform, not a runtime module: the
 * Next.js compiler replaces every `localFont({...})` call with an import of
 * a generated stylesheet and a class name. Outside that compiler the call
 * is a plain function that returns nothing, so a test that imports a
 * layout — the locale layout, or the global 404, which is rendered outside
 * every layout — would fail at import time with a message that reads like a
 * bug in the app.
 *
 * The shape below is the one Next.js's own font mock returns
 * (`next/dist/build/jest/__mocks__/nextFontMock.js`), so the app's import
 * resolves to what the framework expects rather than to a bespoke stand-in
 * that has to be kept in step by hand.
 */
vi.mock("next/font/local", () => ({
  default: () => ({
    className: "className",
    variable: "variable",
    style: { fontFamily: "fontFamily" },
  }),
}));
