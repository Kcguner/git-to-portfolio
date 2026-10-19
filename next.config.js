/**
 * Deployment configuration.
 *
 * The site is published under four locales (`/tr`, `/en`, `/de`, `/es`) and
 * every page is statically cacheable. Two things follow from that and drive
 * most of this file:
 *
 * 1. The locale lives in the path, so the old flat URLs (`/torvalds`) have to
 *    redirect to the new shape (`/tr/torvalds`). That is `redirects()`.
 * 2. Because the pages are cached documents, they cannot carry a per-request
 *    nonce. The Content-Security-Policy is therefore **static** and lives
 *    here, in `headers()`, instead of in the Proxy.
 */

/** The four languages the site is published in. */
const LOCALES = ["tr", "en", "de", "es"];

/**
 * The one path segment that used to be a bare profile URL: anything that is
 * not a locale, a metadata file, an API route or a Next.js internal path.
 *
 * The lookahead rejects an **exact** segment only (`(?:/|$)` after it), so
 * `/english` is still a username while `/en` and `/en/torvalds` are not.
 */
const LEGACY_SEGMENT =
  ":username((?!(?:tr|en|de|es|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|icon\\.svg|favicon\\.ico|api|_next)(?:/|$))[^/]+)";

/**
 * The enforcing Content-Security-Policy.
 *
 * This is the policy the Proxy used to set, with the nonce removed and
 * `'unsafe-inline'` put back in `script-src`. The directives and their order
 * are otherwise unchanged.
 *
 * ── Why there is no hash of the inline theme script ────────────────────────
 * The theme script in `app/theme-script.ts` is a byte-stable string constant,
 * so a SHA-256 hash of it (`sha256-iD2xJtxnozbCXSfnz+MOxIjfzyEkHs26M4sTEr0s9Wo=`)
 * could be allow-listed. **Do not add it.**
 *
 * Per CSP3, when `script-src` contains a valid nonce *or* hash, the browser
 * IGNORES `'unsafe-inline'` for that directive. The App Router delivers the
 * RSC payload as an **inline** `<script>` whose contents change on every
 * response, so a hash-only `script-src` would block the app's own payload:
 * the page would render, but it would never hydrate. A nonce would have the
 * same effect and would additionally force a per-request render, which is
 * exactly what the cached-document migration is trying to avoid.
 *
 * `'unsafe-inline'` is therefore the correct and intended posture here. The
 * other half of the hardening is untouched and is where most of the practical
 * XSS value is: `script-src-attr 'none'` (no inline event handlers),
 * `object-src 'none'`, `frame-src 'none'`, `child-src 'none'`,
 * `base-uri 'self'` and `form-action 'self'`.
 *
 * `headers()` is evaluated at build time, so the development-only
 * relaxations are decided by `process.env.NODE_ENV` here rather than per
 * request.
 */
function buildContentSecurityPolicy() {
  const isDevelopment = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    // `'unsafe-eval'` only in development: the dev overlay and the React
    // refresh runtime need it.
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    // ProfileCard applies the dynamic language percentage with a style
    // attribute.
    "style-src-attr 'unsafe-inline'",
    // The three hosts GitHub serves an avatar from. Keep this list in sync
    // with `images.remotePatterns` below and with AVATAR_HOSTNAMES in
    // components/ProfileCard.tsx: a host that is missing here is blocked by
    // the browser and the avatar is a broken image, whatever the image
    // optimizer allows.
    "img-src 'self' blob: data: https://avatars.githubusercontent.com https://github.com https://camo.githubusercontent.com",
    "font-src 'self'",
    // `ws:`/`wss:` only in development: the HMR socket.
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/**
 * The old strict policy, sent as `Content-Security-Policy-Report-Only`.
 *
 * A report-only header cannot carry a per-request nonce, so the nonce is
 * simply dropped. `'strict-dynamic'` without a nonce blocks **everything**
 * inline, so this policy reports heavily — on the theme script, on the RSC
 * payload, on any inline style. That is expected and it is the entire point:
 * the header observes what the strict policy would have blocked, while the
 * enforcing header above keeps the pages working.
 *
 * The enforcing policy is not replaced by this one; both are sent.
 */
function buildReportOnlyContentSecurityPolicy() {
  const isDevelopment = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    isDevelopment
      ? "style-src 'self' 'unsafe-inline'"
      : "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
    // The same three avatar hosts as the enforcing policy above. The two
    // policies have to agree on their directives: a host that is missing
    // here would be reported as a violation on every avatar.
    "img-src 'self' blob: data: https://avatars.githubusercontent.com https://github.com https://camo.githubusercontent.com",
    "font-src 'self'",
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Phones on the same Wi-Fi open the dev server over the network IP, and
  // Next blocks cross-origin HMR by default. This only affects `next dev`.
  allowedDevOrigins: ['192.168.0.23'],
  sassOptions: {
    quietDeps: true,
  },
  experimental: {
    // The root layout is `app/[locale]/layout.tsx` — a top-level dynamic
    // segment — so there is no layout above the router's own 404 and Next
    // would otherwise inject its own default layout and render the unstyled
    // built-in 404. With this flag `app/global-not-found.tsx` is used
    // instead.
    globalNotFound: true,
  },
  images: {
    // GitHub serves `avatar_url` from a small set of first-party HTTPS hosts:
    // uploaded avatars on avatars.githubusercontent.com, identicon/error
    // fallbacks on github.com, and proxied (camo) assets. Keep this list in
    // sync with AVATAR_HOSTNAMES in components/ProfileCard.tsx.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "camo.githubusercontent.com",
      },
    ],
    // The only image this app optimizes is the GitHub avatar in
    // components/ProfileCard.tsx, laid out at 128 CSS px below `sm` and
    // 160 CSS px from `sm` up. Next's defaults (8 device widths + 8 image
    // widths) made every profile page ship a 15-candidate srcset and a
    // `w=3840` `src` fallback for a 160 px portrait, and the fallback is
    // what clients without srcset support actually download.
    //
    // These two lists are the ladder the avatar really needs: the CSS sizes
    // it is laid out at, and the device-pixel rungs for 2x and 3x screens.
    // `imageSizes` holds the CSS sizes (128, 160), `deviceSizes` the pixel
    // rungs (256 = 2x128, 320 = 2x160, 384 = 3x128, 480 = 3x160), so every
    // candidate is one the browser can actually pick. The two lists together
    // are the exact set of widths the image optimizer accepts. A full-bleed
    // image would need `deviceSizes` widened to real viewport widths.
    deviceSizes: [256, 320, 384, 480],
    imageSizes: [128, 160],
    // AVIF first, then WebP. Next serves the first format in this list that
    // the request's Accept header allows, so modern browsers get the smaller
    // AVIF and the rest fall back to WebP.
    formats: ["image/avif", "image/webp"],
    // Next 16 has no `images.quality` setting — the `images` block is a
    // strict schema and an unknown key there is a FATAL config error, not a
    // warning. The lever is `images.qualities`, the allow-list: the loader
    // snaps the requested quality to the closest allowed entry
    // (`findClosestQuality`), so with `[65]` an image that asks for the
    // default 75 is served at 65.
    //
    // 65 is deliberately chosen over the default 75: on a 160 px portrait
    // the two are visually indistinguishable and 65 is a smaller file.
    //
    // A `quality` prop on a `<Image>` that is not in this list is coerced to
    // 65 (with a dev-server warning). If another `<Image>` ever needs a
    // different quality, add it to this list — the optimizer rejects any
    // `q` that is not listed.
    qualities: [65],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            // `preload` is intentionally omitted: it is only meaningful once the
            // domain is actually on the browser preload list, and shipping it
            // without registration misrepresents the deployment. Add it only
            // after submitting the domain to hstspreload.org.
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(),
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: buildReportOnlyContentSecurityPolicy(),
          },
        ],
      },
    ];
  },
  /**
   * The legacy URL map: the old flat URLs redirect (308) to the new
   * path-locale shape.
   *
   * Two known and accepted behaviours, documented here so nobody tries to
   * "fix" them:
   *
   * 1. A redirect **keeps the incoming query string**. `/?lang=en` answers
   *    with `Location: /en?lang=en` because Next merges the incoming query
   *    into the destination and there is no way to strip a single key. It is
   *    cosmetic: the app ignores the leftover `lang` key and every generated
   *    link drops it.
   * 2. A **repeated** `?lang=en&lang=de` resolves to the **last** value
   *    (`/de`), because `matchHas` tests `value.slice(-1)[0]`. There is no
   *    way to detect a repeated key from `redirects()`.
   *
   * Never write `value: 'tr|en|de|es'` in a `has` rule: `matchHas` compiles
   * it as `new RegExp('^' + value + '$')`, and the alternation binds wrongly
   * — `/^tr|en|de|es$/` matches `english`. One literal per locale is used
   * below.
   *
   * There is deliberately **no** `/` → `/tr` rule: the bare root is answered
   * by the Proxy with a 302 that negotiates the language, and a redirect
   * here would make the Proxy unreachable and break that negotiation.
   */
  async redirects() {
    return [
      // The bare root with an explicit `?lang=`.
      ...LOCALES.map((locale) => ({
        source: "/",
        has: [{ type: "query", key: "lang", value: locale }],
        destination: `/${locale}`,
        permanent: true,
      })),
      // The bare root with a `?lang=` that is not one of the four locales.
      {
        source: "/",
        has: [{ type: "query", key: "lang" }],
        destination: "/tr",
        permanent: true,
      },

      // A bare profile URL with an explicit `?lang=`.
      ...LOCALES.map((locale) => ({
        source: `/${LEGACY_SEGMENT}`,
        has: [{ type: "query", key: "lang", value: locale }],
        destination: `/${locale}/:username`,
        permanent: true,
      })),
      // A bare profile URL with a `?lang=` that is not one of the four locales.
      {
        source: `/${LEGACY_SEGMENT}`,
        has: [{ type: "query", key: "lang" }],
        destination: "/tr/:username",
        permanent: true,
      },

      // A bare profile URL without a `?lang=` at all.
      {
        source: `/${LEGACY_SEGMENT}`,
        destination: "/tr/:username",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
