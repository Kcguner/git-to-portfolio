import { beforeEach, describe, expect, it, vi } from "vitest";

import { LOCALE_HEADER } from "../lib/locale-negotiation";

type NextResponseInit = {
  request: { headers: Headers };
};

type NextRequestLike = {
  url: string;
  headers: Headers;
  nextUrl: { searchParams: URLSearchParams };
};

const nextServerMocks = vi.hoisted(() => ({
  calls: [] as NextResponseInit[],
  reset: () => {
    nextServerMocks.calls.length = 0;
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next(init: NextResponseInit) {
      nextServerMocks.calls.push(init);
      return {
        headers: new Headers(),
      };
    },
  },
}));

const { config, proxy } = await import("../proxy.js");

function createRequest(path: string, headers: Record<string, string> = {}) {
  const parsed = new URL(path, "https://portfolio.example.test");
  const request: NextRequestLike = {
    url: parsed.toString(),
    headers: new Headers(headers),
    nextUrl: { searchParams: parsed.searchParams },
  };

  return request;
}

function forwardedHeaders(): Headers {
  expect(nextServerMocks.calls).toHaveLength(1);
  return nextServerMocks.calls[0].request.headers;
}

function runProxy(path: string, headers: Record<string, string> = {}) {
  nextServerMocks.reset();
  const request = createRequest(path, headers);
  const response = proxy(request) as { headers: Headers };

  return { request, response, forwarded: forwardedHeaders() };
}

describe("proxy", () => {
  beforeEach(() => {
    nextServerMocks.reset();
  });

  it("sets a Content-Security-Policy request header with a nonce", () => {
    const { forwarded, response } = runProxy("/torvalds");

    const policy = forwarded.get("Content-Security-Policy");
    expect(policy).toBeTruthy();
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self' 'nonce-");
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).not.toContain("unsafe-eval");

    const nonce = forwarded.get("x-nonce");
    expect(nonce).toBeTruthy();
    expect(policy).toContain(`'nonce-${nonce}'`);

    expect(response.headers.get("Content-Security-Policy")).toBe(policy);
  });

  it("keeps the original request headers", () => {
    const { forwarded } = runProxy("/", { "user-agent": "vitest" });

    expect(forwarded.get("user-agent")).toBe("vitest");
  });

  it("resolves the locale from an explicit lang query value", () => {
    expect(runProxy("/torvalds?lang=en").forwarded.get(LOCALE_HEADER)).toBe("en");
    expect(runProxy("/torvalds?lang=de").forwarded.get(LOCALE_HEADER)).toBe("de");
    expect(runProxy("/torvalds?lang=es").forwarded.get(LOCALE_HEADER)).toBe("es");
    expect(runProxy("/torvalds?lang=tr").forwarded.get(LOCALE_HEADER)).toBe("tr");
  });

  it("keeps other query parameters intact", () => {
    const { request } = runProxy("/torvalds?tab=repos&lang=en#skills");

    expect(request.nextUrl.searchParams.get("tab")).toBe("repos");
    expect(request.nextUrl.searchParams.get("lang")).toBe("en");
  });

  it("prefers the query value over Accept-Language", () => {
    const { forwarded } = runProxy("/torvalds?lang=es", {
      "accept-language": "de-DE,de;q=0.9",
    });

    expect(forwarded.get(LOCALE_HEADER)).toBe("es");
  });

  it("negotiates Accept-Language when there is no lang query", () => {
    expect(
      runProxy("/", { "accept-language": "en-GB,en;q=0.9" }).forwarded.get(LOCALE_HEADER)
    ).toBe("en");
    expect(
      runProxy("/torvalds", { "accept-language": "de;q=0.8,es;q=0.9" }).forwarded.get(
        LOCALE_HEADER
      )
    ).toBe("es");
  });

  it("falls back to the default locale without a usable Accept-Language", () => {
    expect(runProxy("/").forwarded.get(LOCALE_HEADER)).toBe("tr");
    expect(
      runProxy("/", { "accept-language": "fr-FR,fr" }).forwarded.get(LOCALE_HEADER)
    ).toBe("tr");
    expect(
      runProxy("/", { "accept-language": "" }).forwarded.get(LOCALE_HEADER)
    ).toBe("tr");
  });

  it("defaults for a lang query that is not a single supported locale", () => {
    expect(
      runProxy("/torvalds?lang=fr", { "accept-language": "de" }).forwarded.get(LOCALE_HEADER)
    ).toBe("tr");
    expect(
      runProxy("/torvalds?lang=en&lang=de").forwarded.get(LOCALE_HEADER)
    ).toBe("tr");
  });

  it("overrides a client-supplied locale header", () => {
    expect(
      runProxy("/torvalds?lang=de", { [LOCALE_HEADER]: "es" }).forwarded.get(LOCALE_HEADER)
    ).toBe("de");
    expect(
      runProxy("/torvalds", {
        [LOCALE_HEADER]: "fr",
        "accept-language": "en",
      }).forwarded.get(LOCALE_HEADER)
    ).toBe("en");
    expect(
      runProxy("/torvalds", { [LOCALE_HEADER]: "tr" }).forwarded.get(LOCALE_HEADER)
    ).toBe("tr");
  });

  it("always sets the locale header, even for the default locale", () => {
    const { forwarded } = runProxy("/torvalds");

    expect(forwarded.has(LOCALE_HEADER)).toBe(true);
    expect(forwarded.get(LOCALE_HEADER)).toBe("tr");
    // A spoofed value must be replaced, not appended to.
    expect(forwarded.get(LOCALE_HEADER)).not.toBe("en,de");
  });

  it("never forwards the locale header to the client", () => {
    const { response } = runProxy("/torvalds?lang=de");

    expect(response.headers.has(LOCALE_HEADER)).toBe(false);
  });

  it("returns a NextResponse.next continuation", () => {
    const { response } = runProxy("/torvalds");

    expect(response.headers).toBeInstanceOf(Headers);
    expect(nextServerMocks.calls[0].request.headers).toBeInstanceOf(Headers);
  });
});

describe("proxy matcher", () => {
  it("excludes api, static assets, image optimization and the app icon", () => {
    const [matcher] = config.matcher;
    const source = matcher.source as string;

    expect(source).toContain("api");
    expect(source).toContain("_next/static");
    expect(source).toContain("_next/image");
    expect(source).toContain("icon.svg");
    // There is no favicon.ico in this project; app/icon.svg is the icon.
    expect(source).not.toContain("favicon.ico");
  });

  it("keeps the prefetch exclusions", () => {
    const [matcher] = config.matcher;

    expect(matcher.missing).toEqual([
      { type: "header", key: "next-router-prefetch" },
      { type: "header", key: "purpose", value: "prefetch" },
    ]);
  });
});
