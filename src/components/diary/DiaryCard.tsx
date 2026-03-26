import Link from "next/link";
import type { DiaryPost } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";

/** 記事本文のHTMLから画像URLを抽出 */
function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /<img[^>]+src="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export default function DiaryCard({ post }: { post: DiaryPost }) {
  // coverImage + 本文中の画像を集める
  const images: string[] = [];
  if (post.coverImage) images.push(post.coverImage.url);
  images.push(...extractImageUrls(post.body));
  // 重複除去して最大3枚
  const uniqueImages = [...new Set(images)].slice(0, 3);

  return (
    <Link
      href={`/diary/${post.slug}`}
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-tomato-100/50 hover:-translate-y-1"
    >
      {/* Cover Image */}
      <div className="h-40 relative flex items-center justify-center overflow-hidden">
        {uniqueImages.length >= 2 ? (
          /* 2枚以上: 左右に並べてトマトを中央に */
          <div className="absolute inset-0 flex">
            {uniqueImages.slice(0, 2).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-1/2 h-full object-cover"
              />
            ))}
          </div>
        ) : uniqueImages.length === 1 ? (
          <img
            src={uniqueImages[0]}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-tomato-100 to-sunshine-100" />
        )}
        <span className="relative text-5xl group-hover:scale-110 transition-transform drop-shadow-lg">
          🍅
        </span>
      </div>

      <div className="p-5">
        {/* Category & Day */}
        <div className="flex items-center gap-2 mb-3">
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
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-lg text-soil-900 mb-2 group-hover:text-tomato-500 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-soil-800/70 line-clamp-2">{post.excerpt}</p>

        {/* Date */}
        <p className="text-xs text-soil-800/50 mt-3">
          {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
        </p>
      </div>
    </Link>
  );
}
