import { ImageResponse } from "next/og";

export const alt = "Git-to-Portfolio — GitHub profilinden portföy oluşturma";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#0a0a0c",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#6ee7b7",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9,
                backgroundColor: "#10b981",
                color: "#052e2b",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {"</>"}
            </div>
            <span>Git-to-Portfolio</span>
          </div>
          <div
            style={{
              maxWidth: 920,
              marginTop: 54,
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.08,
            }}
          >
            GitHub&apos;dan portföye.
          </div>
          <div
            style={{
              maxWidth: 760,
              marginTop: 26,
              color: "#a1a1aa",
              fontSize: 28,
              lineHeight: 1.4,
            }}
          >
            Kullanıcı adını yaz, sade ve yazdırılabilir geliştirici portföyünü oluştur.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#a1a1aa",
            fontSize: 21,
          }}
        >
          <span>GitHub profilinizi bir portföye dönüştürün.</span>
          <span style={{ color: "#10b981" }}>SEO ve paylaşım hazır</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
