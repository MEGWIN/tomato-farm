import Link from "next/link";
import { getLatestDiaryPosts } from "@/lib/api";
import DiaryCard from "@/components/diary/DiaryCard";

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
            <DiaryCard key={post.id} post={post} />
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
