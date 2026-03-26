/**
 * データ取得の抽象レイヤー
 * microCMS移行時はこのファイルの内部実装だけ書き換える
 */
import { mockDiaryPosts } from "./mock-data";
import type { DiaryPost, DiaryListResponse } from "./types";

export async function getDiaryPosts(
  offset = 0,
  limit = 10
): Promise<DiaryListResponse> {
  const sorted = [...mockDiaryPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return {
    contents: sorted.slice(offset, offset + limit),
    totalCount: mockDiaryPosts.length,
    offset,
    limit,
  };
}

export async function getDiaryBySlug(
  slug: string
): Promise<DiaryPost | null> {
  return mockDiaryPosts.find((p) => p.slug === slug) ?? null;
}

export async function getLatestDiaryPosts(
  count = 3
): Promise<DiaryPost[]> {
  const res = await getDiaryPosts(0, count);
  return res.contents;
}

export async function getAllSlugs(): Promise<string[]> {
  return mockDiaryPosts.map((p) => p.slug);
}
