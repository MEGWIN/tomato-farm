import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/api";
import { siteConfig } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs();

  const diaryPages = slugs.map((slug) => ({
    url: `${siteConfig.url}/diary/${slug}`,
    lastModified: new Date(),
  }));

  return [
    { url: siteConfig.url, lastModified: new Date() },
    { url: `${siteConfig.url}/diary`, lastModified: new Date() },
    { url: `${siteConfig.url}/about`, lastModified: new Date() },
    ...diaryPages,
  ];
}
