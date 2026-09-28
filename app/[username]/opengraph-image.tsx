import { ImageResponse } from "next/og";
import { GitHubError, getProfile, getTopRepos } from "@/lib/github";
import type { GitHubProfile, GitHubRepo, GitHubRequestOptions } from "@/lib/github";
import { getDictionary, LOCALES, type Locale } from "@/lib/i18n";
import { getLocaleFromImageId, SOCIAL_IMAGE_SIZE } from "@/lib/seo";
import { normalizeUsername } from "@/lib/username";

// Image metadata routes receive route params but not page search params in
// Next.js 16, so the language is carried as the generated image id
// (`/<username>/opengraph-image/<locale>`) instead: one static URL per language,
// which a social crawler can cache on its own, and one card rendered in the
// language of the page that references it.
export function generateImageMetadata() {
  return LOCALES.map((locale) => ({
    id: locale,
    alt: getDictionary(locale).metadata.profileOgImage.label,
    size: { ...SOCIAL_IMAGE_SIZE },
    contentType: "image/png",
  }));
}

const AUTHENTICATED_CACHE_SECONDS = 3600;
const UNAUTHENTICATED_CACHE_SECONDS = 60;
const FAILURE_CACHE_SECONDS = 30;
const RATE_LIMIT_CACHE_SECONDS = 60;
const NOT_FOUND_CACHE_SECONDS = 300;
const INVALID_USERNAME_CACHE_SECONDS = 3600;

type RouteParams = { username: string } | Promise<{ username: string }>;

type ProfileImageProps = {
  params: RouteParams;
  id: Promise<string | number>;
};

type ImageData = {
  username: string;
  profile: GitHubProfile | null;
  repos: GitHubRepo[];
};

async function getUsername(params: RouteParams): Promise<string | null> {
  const { username } = await params;
  let decoded = username;
  try {
    decoded = decodeURIComponent(username);
  } catch {
    decoded = username;
  }
  return normalizeUsername(decoded);
}

function isAuthenticated(): boolean {
  return Boolean(process.env.GITHUB_TOKEN?.trim());
}

function getRequestOptions(): GitHubRequestOptions {
  if (isAuthenticated()) return {};
  return {
    cache: "no-store",
    maxRetries: 1,
    timeoutMs: 5000,
  };
}

function getFailureCacheSeconds(error: unknown): number {
  if (!(error instanceof GitHubError)) return FAILURE_CACHE_SECONDS;

  if (error.code === "primary-rate-limit" || error.code === "secondary-rate-limit") {
    const requestedDelay = Math.ceil((error.retryAfterMs ?? RATE_LIMIT_CACHE_SECONDS * 1000) / 1000);
    return Math.max(1, Math.min(RATE_LIMIT_CACHE_SECONDS, requestedDelay));
  }
  if (error.code === "auth") return RATE_LIMIT_CACHE_SECONDS;
  if (error.code === "user-not-found") return NOT_FOUND_CACHE_SECONDS;
  return FAILURE_CACHE_SECONDS;
}

function cacheHeaders(maxAge: number, staleWhileRevalidate = 0): Record<string, string> {
  const directives = ["public", "max-age=0", `s-maxage=${maxAge}`, "must-revalidate"];
  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  return { "Cache-Control": directives.join(", ") };
}

/*
 * The card is drawn in the same identity as the site: night navy, off-white
 * ink, signal-yellow rules and a titleblock strip. Satori only accepts inline
 * styles, so the palette is spelled out here instead of coming from the CSS
 * tokens - these are the only hex values the site ships, and they are the night
 * theme's own tokens.
 */
const INK = "#E8EEF4";
const MUTED = "#A9BCD0";
const ACCENT = "#FFD400";
const BACKGROUND = "#0A1628";
const SURFACE = "#0D1C33";
const BORDER = "#2A3B55";

/**
 * The three repositories named in the titleblock.
 *
 * Deliberately the starred ranking (`getTopRepos`) and not the pinned list the
 * page itself shows. A card is rendered for every share of a profile URL, most
 * of them by people who never open the page, and the pinned lookup needs a
 * GraphQL token that a card request should not depend on: without one it would
 * degrade to the same ranking anyway, and with one it would add a second
 * request to the one route that is cached per visitor. The titleblock copy
 * therefore stays neutral ("top repositories") instead of claiming these are
 * the repositories the person chose.
 */
function renderImage(
  { username, profile, repos }: ImageData,
  maxAge: number,
  locale: Locale,
  staleWhileRevalidate = 0
) {
  const { profileOgImage } = getDictionary(locale).metadata;
  const displayName = profile?.name?.trim() || profile?.login || profileOgImage.unknownUser;
  const login = profile?.login || username;
  const avatarUrl = profile?.avatar_url?.trim();
  const featuredRepos = repos.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          backgroundColor: BACKGROUND,
          color: INK,
          fontFamily: "sans-serif",
        }}
      >
        {/* Titleblock head: what the drawing is, and in which language. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `2px solid ${BORDER}`,
            paddingBottom: 18,
            color: ACCENT,
            fontSize: 22,
            letterSpacing: 4,
          }}
        >
          <span>{profileOgImage.label}</span>
          {/* The handle is already the drawing's subject, so this cell carries
              the language the card was generated in. */}
          <span style={{ color: MUTED }}>{locale.toUpperCase()}</span>
        </div>

        {/* The person, vertically centred in the space the titleblocks leave. */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 36,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName} avatar`}
              width="168"
              height="168"
              style={{
                width: 168,
                height: 168,
                // A portrait plate on the drawing, not a medallion.
                borderRadius: 2,
                border: `3px solid ${ACCENT}`,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 168,
                height: 168,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                backgroundColor: SURFACE,
                border: `3px solid ${ACCENT}`,
                color: ACCENT,
                fontSize: 60,
                fontWeight: 800,
              }}
            >
              {"@"}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 760,
            }}
          >
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.06 }}>
              {displayName}
            </div>
            <div style={{ display: "flex", marginTop: 14, color: ACCENT, fontSize: 28 }}>
              @{login}
            </div>
            <div style={{ display: "flex", marginTop: 18, color: MUTED, fontSize: 24 }}>
              {featuredRepos.length > 0 ? profileOgImage.featured : profileOgImage.share}
            </div>
          </div>
        </div>

        {/*
          Titleblock foot: the credit line, then the repositories behind it.
          Two rows rather than one shared line, because repository names are
          unbounded and a single row would wrap the credit out of shape.
        */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            backgroundColor: SURFACE,
            borderTop: `2px solid ${ACCENT}`,
            padding: "16px 24px",
            color: MUTED,
            fontSize: 20,
            letterSpacing: 1,
          }}
        >
          <span>{profileOgImage.footer}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", color: INK }}>
            {featuredRepos.length > 0 ? (
              featuredRepos.map((repo) => (
                <span key={repo.id}>{repo.name}</span>
              ))
            ) : (
              <span style={{ color: ACCENT }}>GitHub</span>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...SOCIAL_IMAGE_SIZE,
      headers: cacheHeaders(maxAge, staleWhileRevalidate),
    },
  );
}

export default async function ProfileOpenGraphImage({ params, id }: ProfileImageProps) {
  const locale = getLocaleFromImageId(await id);
  const username = await getUsername(params);
  if (!username) {
    // Nothing to look up: the card is rendered from the localized placeholder
    // and cached hard, because the same invalid path will never resolve.
    return renderImage(
      {
        username: getDictionary(locale).metadata.profileOgImage.unknownUser,
        profile: null,
        repos: [],
      },
      INVALID_USERNAME_CACHE_SECONDS,
      locale
    );
  }

  const requestOptions = getRequestOptions();
  let profile: GitHubProfile | null = null;
  let repos: GitHubRepo[] = [];

  try {
    profile = await getProfile(username, requestOptions);
    repos = await getTopRepos(username, 3, requestOptions);
    return isAuthenticated()
      ? renderImage({ username, profile, repos }, AUTHENTICATED_CACHE_SECONDS, locale, 300)
      : renderImage({ username, profile, repos }, UNAUTHENTICATED_CACHE_SECONDS, locale, 30);
  } catch (error) {
    return renderImage({ username, profile, repos }, getFailureCacheSeconds(error), locale);
  }
}
