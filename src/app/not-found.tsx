import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="text-center">
        <span className="text-8xl block mb-6">🍅</span>
        <h1 className="font-heading font-black text-6xl text-tomato-500 mb-4">
          404
        </h1>
        <p className="font-heading font-bold text-xl text-soil-800 mb-2">
          このトマトは見つかりませんでした...
        </p>
        <p className="text-soil-800/60 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-tomato-500 text-white font-heading font-bold px-6 py-3 rounded-full hover:bg-tomato-600 transition-colors shadow-md"
        >
          🏠 トップに戻る
        </Link>
      </div>
    </div>
  );
}
