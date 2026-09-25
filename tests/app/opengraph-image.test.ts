import { describe, expect, it } from "vitest";
import { generateImageMetadata as homeImages } from "../../app/opengraph-image";
import { generateImageMetadata as profileImages } from "../../app/[username]/opengraph-image";
import { getDictionary, LOCALES } from "../../lib/i18n";
import { getLocaleFromImageId, SOCIAL_IMAGE_SIZE } from "../../lib/seo";

// The routes themselves are excluded from coverage because rendering a card
// needs Satori, but the metadata they generate is what the page's `og:image`
// depends on, and it is pure.
describe("social card image metadata", () => {
  it("generates one card per language for the home page", () => {
    const images = homeImages();

    expect(images.map(({ id }) => id)).toEqual([...LOCALES]);
    for (const image of images) {
      expect(image.size).toEqual({ ...SOCIAL_IMAGE_SIZE });
      expect(image.contentType).toBe("image/png");
      // The alt text is the language's own, and no two languages share one.
      expect(image.alt).toBe(getDictionary(image.id).metadata.ogImage.alt);
    }
    expect(new Set(images.map(({ alt }) => alt)).size).toBe(LOCALES.length);
  });

  it("generates one card per language for a profile", () => {
    const images = profileImages();

    expect(images.map(({ id }) => id)).toEqual([...LOCALES]);
    for (const image of images) {
      expect(image.size).toEqual({ ...SOCIAL_IMAGE_SIZE });
      expect(image.contentType).toBe("image/png");
      expect(image.alt).toBe(getDictionary(image.id).metadata.profileOgImage.label);
    }
  });

  it("resolves every generated id back to the language it was generated for", () => {
    // The id is the URL segment, so a card can only be rendered in the language
    // its URL names.
    for (const { id } of [...homeImages(), ...profileImages()]) {
      expect(getLocaleFromImageId(id)).toBe(id);
    }
  });
});
