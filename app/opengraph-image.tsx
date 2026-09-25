import { ImageResponse } from "next/og";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromImageId, SITE_NAME, SOCIAL_IMAGE_SIZE } from "@/lib/seo";

/**
 * One card per language, each with its own static URL (`/opengraph-image/<id>`).
 *
 * The locale is a path segment rather than a page query parameter because
 * social crawlers request the image on its own and may drop the query string.
 * Separate URLs also mean each language's card is generated once at build time
 * and cached separately, instead of one shared response that would have to be
 * rendered per request and could be cached in the wrong language.
 */
export function generateImageMetadata() {
  return (["tr", "en", "de", "es"] as const).map((locale) => ({
    id: locale,
    alt: getDictionary(locale).metadata.ogImage.alt,
    size: { ...SOCIAL_IMAGE_SIZE },
    contentType: "image/png",
  }));
}

export default async function OpenGraphImage({
  id,
}: {
  id: Promise<string | number>;
}) {
  const locale = getLocaleFromImageId(await id);
  const { ogImage } = getDictionary(locale).metadata;

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
            <span>{SITE_NAME}</span>
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
            {ogImage.headline}
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
            {ogImage.subtitle}
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
          <span>{ogImage.footer}</span>
          <span style={{ color: "#10b981" }}>{ogImage.badge}</span>
        </div>
      </div>
    ),
    { ...SOCIAL_IMAGE_SIZE },
  );
}
