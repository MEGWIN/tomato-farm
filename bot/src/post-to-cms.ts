import type { GeneratedArticle } from "./generate-article";

const ENDPOINT = "tomato";

function getEnv() {
  return {
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
    apiKey: process.env.MICROCMS_API_KEY!,
  };
}

type PostData = GeneratedArticle & {
  coverImageUrl: string | null;
};

/** microCMSに下書きとして投稿 */
export async function postToCms(data: PostData): Promise<{ id: string }> {
  const { serviceDomain, apiKey } = getEnv();

  const body: Record<string, unknown> = {
    title: data.title,
    slug: data.slug,
    body: data.body,
    excerpt: data.excerpt,
    day: data.day,
    category: [data.category],
    claudeAnalysis: data.claudeAnalysis,
    claudeAdvice: data.claudeAdvice,
  };

  if (data.coverImageUrl) {
    body.coverImage = { url: data.coverImageUrl };
  }

  const url = `https://${serviceDomain}.microcms.io/api/v1/${ENDPOINT}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`microCMS投稿失敗 (${res.status}): ${text}`);
  }

  const result = await res.json();
  console.log("✅ microCMS投稿完了:", result.id);
  return result;
}

/** microCMSから既存エントリを取得（下書き含む） */
export async function getCmsEntry(id: string): Promise<Record<string, unknown>> {
  const { serviceDomain, apiKey } = getEnv();
  const url = `https://${serviceDomain}.microcms.io/api/v1/${ENDPOINT}/${id}?draftKey=`;

  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`microCMSエントリ取得失敗 (${res.status}): ${text}`);
  }

  return res.json();
}

/** 既存エントリを更新（PATCH） */
export async function updateCmsEntry(
  id: string,
  data: Partial<Record<string, unknown>>
): Promise<void> {
  const { serviceDomain, apiKey } = getEnv();
  const url = `https://${serviceDomain}.microcms.io/api/v1/${ENDPOINT}/${id}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`microCMS更新失敗 (${res.status}): ${text}`);
  }

  console.log("✅ microCMSエントリ更新完了:", id);
}

/** 画像URLからmicroCMSメディアにアップロード */
export async function uploadImageToCms(
  imageUrl: string,
  filename: string
): Promise<string> {
  const { serviceDomain, apiKey } = getEnv();

  // 画像をダウンロード
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error("画像ダウンロード失敗");
  const contentType = imageRes.headers.get("content-type") || "image/png";
  const imageBuffer = await imageRes.arrayBuffer();

  // microCMS Media APIにアップロード
  const formData = new FormData();
  formData.append("file", new Blob([imageBuffer], { type: contentType }), filename);

  const uploadRes = await fetch(
    `https://${serviceDomain}.microcms-management.io/api/v1/media`,
    {
      method: "POST",
      headers: {
        "X-MICROCMS-API-KEY": apiKey,
      },
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`メディアアップロード失敗 (${uploadRes.status}): ${text}`);
  }

  const result = await uploadRes.json();
  console.log("📸 画像アップロード完了:", result.url);
  return result.url;
}
