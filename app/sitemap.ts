import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const PROFILE_USERNAMES = ["torvalds", "gaearon", "yyx990803"] as const;
// Static route üretimi sırasında bir kez evaluated olur; build tarihini doğru lastmod verir.
const LAST_MODIFIED = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...PROFILE_USERNAMES.map((username) => ({
      url: `${siteUrl}/${username}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
