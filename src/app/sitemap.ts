import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getDiaryPosts } from "@/lib/api";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/diary`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  let diaryEntries: MetadataRoute.Sitemap = [];
  try {
    const { contents } = await getDiaryPosts(0, 100);
    diaryEntries = contents.map((post) => ({
      url: `${base}/diary/${post.slug}`,
      lastModified: new Date(post.revisedAt ?? post.publishedAt),
      changeFrequency: "weekly",
      priority: 0.8,
      images: post.coverImage?.url ? [post.coverImage.url] : undefined,
    }));
  } catch {
    // microCMS未接続時はstaticのみ返す
  }

  return [...staticEntries, ...diaryEntries];
}
