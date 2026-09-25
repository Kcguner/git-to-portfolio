import { ImageResponse } from "next/og";
import { GitHubError, getProfile, getTopRepos } from "@/lib/github";
import type { GitHubProfile, GitHubRepo, GitHubRequestOptions } from "@/lib/github";
import { normalizeUsername } from "@/lib/username";

// Image metadata routes receive route params but not page search params in
// Next.js 16, so this image stays language-independent for every locale.
export const alt = "GitHub portfolio created with Git-to-Portfolio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const AUTHENTICATED_CACHE_SECONDS = 3600;
const UNAUTHENTICATED_CACHE_SECONDS = 60;
const FAILURE_CACHE_SECONDS = 30;
const RATE_LIMIT_CACHE_SECONDS = 60;
const NOT_FOUND_CACHE_SECONDS = 300;
const INVALID_USERNAME_CACHE_SECONDS = 3600;

type RouteParams = { username: string } | Promise<{ username: string }>;

type ProfileImageProps = {
  params: RouteParams;
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

function renderImage(
  { username, profile, repos }: ImageData,
  maxAge: number,
  staleWhileRevalidate = 0
) {
  const displayName = profile?.name?.trim() || profile?.login || username;
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
          padding: "68px 80px",
          backgroundColor: "#0a0a0c",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                width="144"
                height="144"
                style={{
                  width: 144,
                  height: 144,
                  borderRadius: 72,
                  border: "4px solid #10b981",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 144,
                  height: 144,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 72,
                  backgroundColor: "#052e2b",
                  border: "4px solid #10b981",
                  color: "#6ee7b7",
                  fontSize: 52,
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
                maxWidth: 720,
              }}
            >
              <div style={{ display: "flex", color: "#10b981", fontSize: 22, fontWeight: 700 }}>
                GitHub portfolio
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 12,
                  fontSize: 60,
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {displayName}
              </div>
              <div style={{ display: "flex", marginTop: 12, color: "#a1a1aa", fontSize: 28 }}>
                @{login}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", color: "#a1a1aa", fontSize: 24 }}>
            {featuredRepos.length > 0
              ? "Featured GitHub projects"
              : "GitHub profile share"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #27272a",
            paddingTop: 24,
            color: "#a1a1aa",
            fontSize: 20,
          }}
        >
          <span>Created with Git-to-Portfolio</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {featuredRepos.length > 0 ? (
              featuredRepos.map((repo) => (
                <span key={repo.id} style={{ color: "#a1a1aa" }}>
                  {repo.name}
                </span>
              ))
            ) : (
              <span style={{ color: "#6ee7b7" }}>GitHub</span>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: cacheHeaders(maxAge, staleWhileRevalidate),
    },
  );
}

export default async function ProfileOpenGraphImage({ params }: ProfileImageProps) {
  const username = await getUsername(params);
  if (!username) {
    return renderImage(
      { username: "GitHub user", profile: null, repos: [] },
      INVALID_USERNAME_CACHE_SECONDS
    );
  }

  const requestOptions = getRequestOptions();
  let profile: GitHubProfile | null = null;
  let repos: GitHubRepo[] = [];

  try {
    profile = await getProfile(username, requestOptions);
    repos = await getTopRepos(username, 3, requestOptions);
    return isAuthenticated()
      ? renderImage({ username, profile, repos }, AUTHENTICATED_CACHE_SECONDS, 300)
      : renderImage({ username, profile, repos }, UNAUTHENTICATED_CACHE_SECONDS, 30);
  } catch (error) {
    return renderImage({ username, profile, repos }, getFailureCacheSeconds(error));
  }
}
