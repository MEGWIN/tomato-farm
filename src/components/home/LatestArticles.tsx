import Link from "next/link";
import { getLatestDiaryPosts } from "@/lib/api";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";

export default async function LatestArticles() {
  const posts = await getLatestDiaryPosts(3);

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-soil-900 mb-3">
            <span className="text-tomato-500">🍅</span> 最新の栽培日記
          </h2>
          <p className="text-soil-800/70">毎日更新！MEGWINのリアル栽培ドキュメンタリー</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/diary/${post.slug}`}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-tomato-100/50 hover:-translate-y-1"
            >
              {/* Cover Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-tomato-100 to-sunshine-100 flex items-center justify-center">
                <span className="text-6xl group-hover:scale-110 transition-transform">
                  🍅
                </span>
              </div>

              <div className="p-5">
                {/* Category & Day */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      CATEGORY_COLORS[post.category]
                    }`}
                  >
                    {CATEGORY_LABELS[post.category]}
                  </span>
                  <span className="text-xs font-bold text-tomato-500 bg-tomato-50 px-3 py-1 rounded-full">
                    Day {post.day}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-heading font-bold text-lg text-soil-900 mb-2 group-hover:text-tomato-500 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-soil-800/70 line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Date */}
                <p className="text-xs text-soil-800/50 mt-3">
                  {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* More Link */}
        <div className="text-center mt-10">
          <Link
            href="/diary"
            className="inline-flex items-center gap-2 font-heading font-bold text-tomato-500 hover:text-tomato-700 transition-colors text-lg"
          >
            すべての日記を見る →
          </Link>
        </div>
      </div>
    </section>
  );
}
