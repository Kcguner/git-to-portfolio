import { ImageResponse } from "next/og";
import { getProfile, getTopRepos } from "@/lib/github";
import type { GitHubProfile, GitHubRepo } from "@/lib/github";

export const alt = "GitHub profilinden oluşturulan Git-to-Portfolio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type RouteParams = { username: string } | Promise<{ username: string }>;

type ProfileImageProps = {
  params: RouteParams;
};

type ImageData = {
  username: string;
  profile: GitHubProfile | null;
  repos: GitHubRepo[];
};

async function getUsername(params: RouteParams): Promise<string> {
  const { username } = await params;
  try {
    return decodeURIComponent(username).trim();
  } catch {
    return username.trim();
  }
}

function renderImage({ username, profile, repos }: ImageData) {
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
                alt={`${displayName} avatarı`}
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
                GitHub portföyü
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
              ? "Öne çıkan GitHub projeleri"
              : "GitHub profil paylaşımı"}
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
          <span>Git-to-Portfolio ile oluşturuldu</span>
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
    { ...size },
  );
}

export default async function ProfileOpenGraphImage({ params }: ProfileImageProps) {
  const username = await getUsername(params);

  try {
    const [profile, repos] = await Promise.all([
      getProfile(username),
      getTopRepos(username, 3),
    ]);
    return renderImage({ username, profile, repos });
  } catch {
    return renderImage({ username, profile: null, repos: [] });
  }
}
