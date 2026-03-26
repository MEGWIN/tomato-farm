import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "「AI×素人＝プチトマト農家への道」プロジェクトについて。MEGWINとClaude先生の紹介。",
};

export default function AboutPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-heading font-black text-4xl md:text-5xl text-soil-900 mb-4">
            About This Project
          </h1>
          <p className="text-soil-800/70 text-lg">
            AI時代の新しい農業の形を、素人が本気で目指す
          </p>
        </div>

        {/* What is this */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-tomato-500 to-orange-500 text-white rounded-2xl p-8 md:p-12 shadow-lg">
            <h2 className="font-heading font-black text-2xl md:text-3xl mb-4">
              🍅 このプロジェクトとは？
            </h2>
            <p className="text-white/90 leading-relaxed text-lg">
              水耕栽培完全素人の<strong>MEGWIN</strong>が、
              AI（<strong>Claude先生</strong>）の分析・予測・アドバイスを活用して
              プチトマトの水耕栽培に挑戦するリアルドキュメンタリーブログです。
            </p>
            <p className="text-white/90 leading-relaxed text-lg mt-4">
              ESP32で自動化、Discord BotでAIが催促、写真からAIが診断 ―
              他にない「<strong>AIが監督するスマート農場</strong>」を実現します。
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="font-heading font-black text-3xl text-soil-900 text-center mb-10">
            チームメンバー
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MEGWIN */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-tomato-100/50 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-sunshine-300 to-tomato-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👨</span>
              </div>
              <h3 className="font-heading font-black text-xl text-soil-900 mb-2">
                MEGWIN
              </h3>
              <p className="text-tomato-500 font-bold text-sm mb-4">
                栽培担当 / 作業員 / 素人
              </p>
              <p className="text-soil-800/70 text-sm leading-relaxed">
                YouTuber。水耕栽培は完全初心者。
                Claude先生の指示に従って作業するのが仕事。
                「MAJIDE」が口癖。目標はプチトマト1,000個収穫。
              </p>
            </div>

            {/* Claude先生 */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-leaf-200/50 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-leaf-300 to-leaf-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🩺</span>
              </div>
              <h3 className="font-heading font-black text-xl text-soil-900 mb-2">
                Claude先生
              </h3>
              <p className="text-leaf-600 font-bold text-sm mb-4">
                AI栽培アドバイザー / 監督 / 記事生成
              </p>
              <p className="text-soil-800/70 text-sm leading-relaxed">
                Anthropic社のAI。写真から成長分析、気象データから未来予測、
                栽培アドバイスまで全力サポート。
                このサイトの記事もClaude先生が生成しています。
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-16">
          <h2 className="font-heading font-black text-3xl text-soil-900 text-center mb-10">
            技術スタック
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "⚡", name: "Next.js", desc: "フロントエンド" },
              { icon: "🎨", name: "Tailwind CSS", desc: "スタイリング" },
              { icon: "📝", name: "microCMS", desc: "記事管理" },
              { icon: "▲", name: "Vercel", desc: "ホスティング" },
              { icon: "🤖", name: "Claude AI", desc: "分析・生成" },
              { icon: "📡", name: "ESP32", desc: "IoTセンサー" },
              { icon: "💬", name: "Discord Bot", desc: "通知・連携" },
              { icon: "📊", name: "Chart.js", desc: "データ可視化" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="bg-white rounded-xl p-4 text-center shadow-sm border border-soil-200/50"
              >
                <span className="text-3xl block mb-2">{tech.icon}</span>
                <p className="font-heading font-bold text-sm text-soil-900">
                  {tech.name}
                </p>
                <p className="text-xs text-soil-800/50">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section>
          <h2 className="font-heading font-black text-3xl text-soil-900 text-center mb-10">
            ロードマップ
          </h2>
          <div className="space-y-4">
            {[
              {
                phase: "Phase 1",
                title: "MVP公開",
                desc: "HP + 栽培日記 + About",
                status: "now" as const,
              },
              {
                phase: "Phase 2",
                title: "AI機能追加",
                desc: "成長判定 + グラフ + ESP32センサー",
                status: "upcoming" as const,
              },
              {
                phase: "Phase 3",
                title: "フル機能版",
                desc: "チャットボット + タイムラプス + コスト管理 + IoT自動化",
                status: "upcoming" as const,
              },
              {
                phase: "Phase 4",
                title: "拡張・収益化",
                desc: "SEO + 比較実験ページ + メルカリ販売挑戦",
                status: "upcoming" as const,
              },
            ].map((item) => (
              <div
                key={item.phase}
                className={`flex items-center gap-4 rounded-xl p-5 border ${
                  item.status === "now"
                    ? "bg-tomato-50 border-tomato-300 shadow-md"
                    : "bg-white border-soil-200/50"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    item.status === "now"
                      ? "bg-tomato-500 animate-tomato-pulse"
                      : "bg-soil-200"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-heading font-black text-sm ${
                        item.status === "now"
                          ? "text-tomato-500"
                          : "text-soil-800/50"
                      }`}
                    >
                      {item.phase}
                    </span>
                    {item.status === "now" && (
                      <span className="text-xs font-bold text-white bg-tomato-500 px-2 py-0.5 rounded-full">
                        NOW
                      </span>
                    )}
                  </div>
                  <p
                    className={`font-heading font-bold ${
                      item.status === "now"
                        ? "text-soil-900"
                        : "text-soil-800/60"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-sm text-soil-800/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
