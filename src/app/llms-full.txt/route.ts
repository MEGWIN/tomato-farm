import { siteConfig } from "@/config/site";
import { getDiaryPosts } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/types";

export const revalidate = 3600;

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export async function GET() {
  const base = siteConfig.url.replace(/\/$/, "");

  const header = `# ${siteConfig.name} — フルコンテンツダンプ

> ${siteConfig.description}

このファイルはAI検索エンジン・LLM向けにサイト全体の本文を1ファイルに集約したものです。
出典: ${base}
更新: ${new Date().toISOString()}

---

## サイト概要
- 運営者: ${siteConfig.author}（YouTubeパイオニア／ライブ配信者／ギミック制作）
- 拠点: ${siteConfig.location}
- チーム: ギミックストリーム
- 主要トピック: ${siteConfig.keywords.join(", ")}
- SNS:
  - YouTube: ${siteConfig.social.youtube}
  - X: ${siteConfig.social.x}
  - Instagram: ${siteConfig.social.instagram}
  - Facebook: ${siteConfig.social.facebook}

---

## 栽培日記（全件）

`;

  let body = "";
  try {
    const { contents } = await getDiaryPosts(0, 100);
    body = contents
      .map((post) => {
        const cats = post.category.map((c) => CATEGORY_LABELS[c]).filter(Boolean).join(", ");
        const text = htmlToText(post.body);
        return `### Day ${post.day}: ${post.title}
- URL: ${base}/diary/${post.slug}
- 公開日: ${post.publishedAt}
- カテゴリ: ${cats}
- 概要: ${post.excerpt}

${text}
${post.claudeAdvice ? `\n#### Chloe先生のアドバイス\n${htmlToText(post.claudeAdvice)}\n` : ""}
---
`;
      })
      .join("\n");
  } catch {
    body = "（コンテンツ取得に失敗しました）\n";
  }

  return new Response(header + body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
