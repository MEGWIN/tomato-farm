export const revalidate = 60;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiaryBySlug, getAllSlugs, getDiaryPosts } from "@/lib/api";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";
import ClaudeSensei from "@/components/diary/ClaudeSensei";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getDiaryBySlug(slug);
  if (!post) return { title: "記事が見つかりません" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

/** Wrap 2+ consecutive <figure> elements in a 3-column grid container */
function processBodyHtml(html: string): string {
  if (html.includes("image-grid")) return html;
  return html.replace(
    /(?:<figure[\s\S]*?<\/figure>\s*){2,}/g,
    (match) => `<div class="image-grid">${match}</div>`
  );
}

/** Split body into main content and version-up appendix */
function splitBody(html: string): { main: string; appendix: string | null } {
  const marker = '<section class="version-up">';
  const idx = html.indexOf(marker);
  if (idx === -1) return { main: html, appendix: null };
  const endTag = '</section>';
  const endIdx = html.indexOf(endTag, idx);
  if (endIdx === -1) return { main: html, appendix: null };
  const appendix = html.slice(idx + marker.length, endIdx);
  const main = html.slice(0, idx) + html.slice(endIdx + endTag.length);
  return { main, appendix };
}

export default async function DiaryDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getDiaryBySlug(slug);

  if (!post) notFound();

  // Get all posts for prev/next navigation
  const { contents: allPosts } = await getDiaryPosts(0, 100);
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  return (
    <article className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/diary"
          className="inline-flex items-center gap-1 text-sm text-tomato-500 hover:text-tomato-700 font-bold mb-8 transition-colors"
        >
          ← 栽培日記一覧に戻る
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                CATEGORY_COLORS[post.category[0]]
              }`}
            >
              {CATEGORY_LABELS[post.category[0]]}
            </span>
            <span className="text-xs font-bold text-tomato-500 bg-tomato-50 px-3 py-1 rounded-full">
              Day {post.day}
            </span>
            <span className="text-xs text-soil-800/50">
              {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
            </span>
          </div>

          <h1 className="font-heading font-black text-3xl md:text-4xl text-soil-900 leading-tight">
            {post.title}
          </h1>
        </header>

        {/* Cover Image (本文に画像がある場合は非表示) */}
        {!/<img\s/.test(post.body) && (
          post.coverImage ? (
            <img
              src={post.coverImage.url}
              alt={post.title}
              className="max-h-[480px] rounded-2xl mb-8 mx-auto"
            />
          ) : (
            <div className="h-64 md:h-80 bg-gradient-to-br from-tomato-100 to-sunshine-100 rounded-2xl flex items-center justify-center mb-8">
              <span className="text-8xl">🍅</span>
            </div>
          )
        )}

        {/* Article Body */}
        {(() => {
          const { main, appendix } = splitBody(post.body);
          return (
            <>
              <div
                className="article-body prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-soil-900 prose-p:text-soil-800 prose-li:text-soil-800"
                dangerouslySetInnerHTML={{ __html: processBodyHtml(main) }}
              />

              {/* Claude Sensei Section */}
              <ClaudeSensei
                analysis={post.claudeAnalysis}
                advice={post.claudeAdvice}
              />

              {/* Appendix (version-up etc.) - below sensei */}
              {appendix && (
                <div
                  className="article-body prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-soil-900 prose-p:text-soil-800 prose-li:text-soil-800 mt-8 pt-8 border-t border-tomato-100"
                  dangerouslySetInnerHTML={{ __html: appendix }}
                />
              )}
            </>
          );
        })()}

        {/* Prev / Next */}
        <nav className="mt-12 pt-8 border-t border-tomato-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevPost ? (
            <Link
              href={`/diary/${prevPost.slug}`}
              className="group bg-white rounded-xl p-4 border border-tomato-100/50 hover:border-tomato-300 transition-colors"
            >
              <span className="text-xs text-soil-800/50">← 前の日記</span>
              <p className="font-heading font-bold text-sm text-soil-900 group-hover:text-tomato-500 transition-colors line-clamp-1 mt-1">
                {prevPost.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {nextPost && (
            <Link
              href={`/diary/${nextPost.slug}`}
              className="group bg-white rounded-xl p-4 border border-tomato-100/50 hover:border-tomato-300 transition-colors text-right"
            >
              <span className="text-xs text-soil-800/50">次の日記 →</span>
              <p className="font-heading font-bold text-sm text-soil-900 group-hover:text-tomato-500 transition-colors line-clamp-1 mt-1">
                {nextPost.title}
              </p>
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
