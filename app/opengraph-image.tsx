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

/*
 * The card is drawn in the same identity as the site: night navy, off-white
 * ink, one signal-yellow rule and a mono label. Satori only accepts inline
 * styles, so the palette is spelled out here instead of coming from the CSS
 * tokens - these are the only hex values the site ships, and they are the
 * night theme's tokens, not a separate design.
 */
const INK = "#E8EEF4";
const MUTED = "#A9BCD0";
const ACCENT = "#FFD400";
const BACKGROUND = "#0A1628";
const SURFACE = "#0D1C33";
const BORDER = "#2A3B55";

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
          padding: "64px 72px",
          backgroundColor: BACKGROUND,
          color: INK,
          fontFamily: "monospace",
        }}
      >
        {/* Titleblock head: the drawing's own reference, in accent. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `2px solid ${BORDER}`,
            paddingBottom: 20,
            color: ACCENT,
            fontSize: 22,
            letterSpacing: 4,
          }}
        >
          <span>{SITE_NAME}</span>
          <span style={{ color: MUTED }}>{ogImage.badge}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              maxWidth: 980,
              marginTop: 46,
              color: INK,
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -2,
            }}
          >
            {ogImage.headline}
          </div>
          {/* A drawn rule in the accent, not a gradient fill. */}
          <div style={{ width: 120, height: 8, marginTop: 34, backgroundColor: ACCENT }} />
          <div
            style={{
              maxWidth: 820,
              marginTop: 30,
              color: MUTED,
              fontSize: 28,
              lineHeight: 1.45,
            }}
          >
            {ogImage.subtitle}
          </div>
        </div>

        {/* Titleblock foot: the sheet number and the copyright line. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${BORDER}`,
            paddingTop: 20,
            backgroundColor: SURFACE,
            color: MUTED,
            fontSize: 20,
            letterSpacing: 2,
          }}
        >
          <span>{ogImage.footer}</span>
          <span style={{ color: ACCENT }}>{locale.toUpperCase()}</span>
        </div>
      </div>
    ),
    { ...SOCIAL_IMAGE_SIZE },
  );
}
