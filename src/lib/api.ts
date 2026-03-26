/**
 * データ取得レイヤー - microCMS接続
 */
import { createClient } from "microcms-js-sdk";
import type { DiaryPost, DiaryListResponse } from "./types";

const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
  apiKey: process.env.MICROCMS_API_KEY!,
});

const ENDPOINT = "tomato";

export async function getDiaryPosts(
  offset = 0,
  limit = 10
): Promise<DiaryListResponse> {
  return await client.getList<DiaryPost>({
    endpoint: ENDPOINT,
    queries: { offset, limit, orders: "-publishedAt" },
  });
}

export async function getDiaryBySlug(
  slug: string
): Promise<DiaryPost | null> {
  const res = await client.getList<DiaryPost>({
    endpoint: ENDPOINT,
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return res.contents[0] ?? null;
}

export async function getLatestDiaryPosts(
  count = 3
): Promise<DiaryPost[]> {
  const res = await getDiaryPosts(0, count);
  return res.contents;
}

export async function getAllSlugs(): Promise<string[]> {
  const res = await client.getList<DiaryPost>({
    endpoint: ENDPOINT,
    queries: { fields: "slug", limit: 100 },
  });
  return res.contents.map((p) => p.slug);
}
