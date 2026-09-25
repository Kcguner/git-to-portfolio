/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  sassOptions: {
    quietDeps: true,
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
