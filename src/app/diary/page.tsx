export const revalidate = 60;

import type { Metadata } from "next";
import { getDiaryPosts } from "@/lib/api";
import DiaryCard from "@/components/diary/DiaryCard";

export const metadata: Metadata = {
  title: "栽培日記",
  description:
    "MEGWINのプチトマト水耕栽培ドキュメンタリー。毎日の成長記録とChloe先生のAI分析。",
};

export default async function DiaryPage() {
  const { contents: posts } = await getDiaryPosts(0, 50);

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading font-black text-4xl md:text-5xl text-soil-900 mb-4">
            <span className="text-tomato-500">🍅</span> 栽培日記
          </h1>
          <p className="text-soil-800/70 text-lg">
            MEGWINのリアル栽培ドキュメンタリー
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <DiaryCard key={post.id} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🌱</span>
            <p className="font-heading font-bold text-xl text-soil-800/50">
              まだ日記がありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
