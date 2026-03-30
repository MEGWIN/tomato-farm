interface Product {
  name: string;
  description: string;
  url: string;
  emoji: string;
}

const PRODUCTS: Product[] = [
  {
    name: "液肥の原料",
    description: "これを水に溶かして液体肥料を作ってるぜ。水耕栽培の基本中の基本！",
    url: "https://amzn.to/4tb5SaE",
    emoji: "🧪",
  },
];

export default function AffiliateTools() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-heading font-black text-2xl md:text-3xl text-soil-900 mb-2">
            MEGWINが使ってる道具
          </h2>
          <p className="text-soil-800/60 text-sm">
            オレが実際に使ってるやつだけ紹介するぜ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRODUCTS.map((product) => (
            <a
              key={product.url}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 bg-white rounded-2xl p-6 border border-sunshine-200/50 shadow-sm hover:shadow-md hover:border-sunshine-300 transition-all"
            >
              <span className="text-4xl shrink-0">{product.emoji}</span>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-lg text-soil-900 group-hover:text-tomato-500 transition-colors mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-soil-800/70 leading-relaxed mb-2">
                  {product.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-sunshine-600">
                  Amazonで見る →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
