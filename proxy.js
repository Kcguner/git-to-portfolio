import { NextResponse } from "next/server";
import { SITE_LOCALE_COOKIE, resolveRequestLocale } from "@/lib/locale-negotiation";

/**
 * The Proxy answers the one address that cannot name a language: the bare
 * `/`.
 *
 * The locale lives in the path (`/en/torvalds`), so every other URL already
 * says which language it is and is served without any negotiation at all.
 * `/` is the single exception: the Proxy resolves the visitor's language from
 * their `site-locale` cookie and their `Accept-Language` header and answers
 * with a temporary redirect to `/<locale>`.
 *
 * The redirect is a `302` and not a permanent one on purpose. The language a
 * visitor reads in is a preference, not a permanent property of the URL, and
 * the same visitor may well read the next page in another language. The
 * choice is remembered in the `site-locale` cookie, so the root only has to
 * guess once.
 *
 * The cookie is deliberately readable by scripts (`httpOnly: false`): the
 * language switcher in the header is a client component and reads the cookie
 * to keep itself in sync with the language the server chose.
 *
 * The security headers — including the static Content-Security-Policy — live
 * in `next.config.js`. They used to be set here, with a nonce that was minted
 * per request, but a nonce forces every page to be rendered per request and
 * a document that is rendered per request cannot be cached.
 */
export function proxy(request) {
  const locale = resolveRequestLocale({
    acceptLanguage: request.headers.get("accept-language"),
    cookie: request.cookies.get(SITE_LOCALE_COOKIE)?.value,
  });

  // The target is always `/<locale>` and never `/` itself, so the Proxy
  // cannot redirect the root to itself.
  const response = NextResponse.redirect(new URL("/" + locale, request.url), 302);

  response.cookies.set(SITE_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}

export const config = {
  // Only the bare root needs a language, and the matcher is an exact path:
  // `/tr`, `/en/torvalds` and every other localized URL never reach the
  // Proxy at all.
  matcher: ["/"],
};
