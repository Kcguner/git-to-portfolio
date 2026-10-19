import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { SITE_LOCALE_COOKIE } from "../lib/locale-negotiation";

const { config, proxy } = await import("../proxy.js");

type ProxyOptions = {
  /** Request headers, e.g. `accept-language`. */
  headers?: Record<string, string>;
  /** The raw `Cookie` header, e.g. `site-locale=es`. */
  cookie?: string;
};

const ORIGIN = "https://portfolio.example.test";

function createRequest(path: string, options: ProxyOptions = {}) {
  const url = new URL(path, ORIGIN);
  const headers = new Headers(options.headers);

  if (options.cookie !== undefined) headers.set("cookie", options.cookie);

  return new NextRequest(url, { headers });
}

function runProxy(path = "/", options: ProxyOptions = {}) {
  const request = createRequest(path, options);
  const response = proxy(request);

  return { request, response };
}

/** The path part of the `Location` header, e.g. `/en` out of a full URL. */
function locationPathname(response: { headers: Headers }): string | null {
  const location = response.headers.get("location");

  return location === null ? null : new URL(location).pathname;
}

describe("proxy", () => {
  it("redirects the bare root to the negotiated locale", () => {
    const { response } = runProxy("/", { headers: { "accept-language": "en" } });

    expect(response.status).toBe(302);
    expect(locationPathname(response)).toBe("/en");
    expect(new URL(response.headers.get("location") ?? "").origin).toBe(ORIGIN);
  });

  it("negotiates a regional language tag", () => {
    const { response } = runProxy("/", {
      headers: { "accept-language": "de-DE,de;q=0.9" },
    });

    expect(response.status).toBe(302);
    expect(locationPathname(response)).toBe("/de");
  });

  it("falls back to the default locale without a usable Accept-Language", () => {
    expect(locationPathname(runProxy("/").response)).toBe("/tr");
    expect(
      locationPathname(
        runProxy("/", { headers: { "accept-language": "fr-FR,fr" } }).response
      )
    ).toBe("/tr");
    expect(
      locationPathname(runProxy("/", { headers: { "accept-language": "" } }).response)
    ).toBe("/tr");
  });

  it("prefers the site-locale cookie over Accept-Language", () => {
    const { response } = runProxy("/", {
      headers: { "accept-language": "en" },
      cookie: `${SITE_LOCALE_COOKIE}=es`,
    });

    expect(response.status).toBe(302);
    expect(locationPathname(response)).toBe("/es");
  });

  it("ignores an unusable site-locale cookie", () => {
    const { response } = runProxy("/", {
      headers: { "accept-language": "de" },
      cookie: `${SITE_LOCALE_COOKIE}=xx`,
    });

    expect(response.status).toBe(302);
    expect(locationPathname(response)).toBe("/de");
  });

  it("remembers the resolved locale in the site-locale cookie", () => {
    const { response } = runProxy("/", {
      headers: { "accept-language": "en" },
    });

    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain(`${SITE_LOCALE_COOKIE}=en`);
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toMatch(/Max-Age=31536000/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    // The language switcher is a client component and reads the cookie.
    expect(setCookie).not.toContain("HttpOnly");
  });

  it("sets no Content-Security-Policy and mints no nonce", () => {
    const { request, response } = runProxy("/", {
      headers: { "accept-language": "en" },
    });

    expect(response.headers.get("content-security-policy")).toBeNull();
    expect(response.headers.get("x-nonce")).toBeNull();
    // The request headers are left alone: no locale header, no policy.
    expect(request.headers.get("x-nonce")).toBeNull();
    expect(request.headers.get("content-security-policy")).toBeNull();
    expect(request.headers.get("x-site-locale")).toBeNull();
    // Next.js only sets this header when the Proxy rewrites request headers.
    expect(response.headers.get("x-middleware-override-headers")).toBeNull();
  });

  it("redirects to a locale path and never to itself", () => {
    for (const locale of ["tr", "en", "de", "es"]) {
      const { response } = runProxy("/", { cookie: `${SITE_LOCALE_COOKIE}=${locale}` });
      const pathname = locationPathname(response);

      expect(pathname).toBe(`/${locale}`);
      // A redirect to `/` would be a loop: the Proxy would run again.
      expect(pathname).not.toBe("/");
    }
  });
});

describe("proxy matcher", () => {
  it("matches the bare root only", () => {
    expect(config.matcher).toEqual(["/"]);
  });
});
