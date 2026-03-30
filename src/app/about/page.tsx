import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description:
    "「AI×素人＝プチトマト農家への道」プロジェクトについて。MEGWINとChloe先生の紹介。",
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
              AI（<strong>Chloe先生</strong>）の分析・予測・アドバイスを活用して
              プチトマトの水耕栽培に挑戦するリアルドキュメンタリーブログです。
            </p>
            <p className="text-white/90 leading-relaxed text-lg mt-4">
              ESP32で自動化、Discord BotでAIが催促、写真からAIが診断 ―
              他にない「<strong>AIが監督するスマート農場</strong>」を実現します。
            </p>
            <p className="text-white/90 leading-relaxed text-lg mt-4">
              <strong>ギミックストリーム</strong>（gimmickstream.com）チームの一環として、
              視聴者のアクションで物理デバイスが動くインタラクティブ配信の延長にある企画です。
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="font-heading font-black text-3xl text-soil-900 text-center mb-10">
            チームメンバー
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* MEGWIN */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-tomato-100/50 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                <Image
                  src="/images/megwin.jpg"
                  alt="MEGWIN"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-heading font-black text-xl text-soil-900 mb-2">
                MEGWIN
              </h3>
              <p className="text-tomato-500 font-bold text-sm mb-4">
                YouTubeパイオニア / ギミックストリーム共同代表
              </p>
              <p className="text-soil-800/70 text-sm leading-relaxed">
                ２０年以上のキャリアを持つYouTuber・ストリーマー。
                八王子を拠点に、プログラミング×電子工作×ライブ配信を融合した
                「体験型ストリーミング」を手がけている。
                ドイツ人妻と娘２人のパパでもある。
                「MAJIDE」が口癖。ただいま軍団募集中。
              </p>
            </div>

            {/* Chloe先生 */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-leaf-200/50 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                <Image
                  src="/images/chloe.png"
                  alt="Chloe先生"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-heading font-black text-xl text-soil-900 mb-2">
                Chloe先生
              </h3>
              <p className="text-leaf-600 font-bold text-sm mb-4">
                AI栽培アドバイザー / 監督 / 記事生成
              </p>
              <p className="text-soil-800/70 text-sm leading-relaxed">
                Anthropic社のAI。写真から成長分析、気象データから未来予測、
                栽培アドバイスまで全力サポート。
                このサイトの記事もChloe先生が生成しています。
              </p>
            </div>
            {/* パンダ */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-soil-200/50 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                <Image
                  src="/images/panda.png"
                  alt="パンダ"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-heading font-black text-xl text-soil-900 mb-2">
                パンダ
              </h3>
              <p className="text-soil-600 font-bold text-sm mb-4">
                中国産 / 新メンバー
              </p>
              <p className="text-soil-800/70 text-sm leading-relaxed">
                軍団オーディションで選ばれ、いまこっそり日本に来ている。
                好きな食べ物は牛肉のステーキ。焼き加減はミディアムベア。
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
              { icon: "/images/tech/nextjs.svg", name: "Next.js", desc: "フロントエンド" },
              { icon: "/images/tech/tailwindcss.svg", name: "Tailwind CSS", desc: "スタイリング" },
              { icon: "/images/tech/microcms.svg", name: "microCMS", desc: "記事管理" },
              { icon: "/images/tech/vercel.svg", name: "Vercel", desc: "ホスティング" },
              { icon: "/images/tech/claude.svg", name: "Claude AI", desc: "分析・生成" },
              { icon: "/images/tech/esp32.svg", name: "ESP32", desc: "IoTセンサー" },
              { icon: "/images/tech/discord.svg", name: "Discord Bot", desc: "通知・連携" },
              { icon: "/images/tech/chartjs.svg", name: "Chart.js", desc: "データ可視化" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="bg-white rounded-xl p-4 text-center shadow-sm border border-soil-200/50"
              >
                <Image
                  src={tech.icon}
                  alt={tech.name}
                  width={40}
                  height={40}
                  className="mx-auto mb-2"
                />
                <p className="font-heading font-bold text-sm text-soil-900">
                  {tech.name}
                </p>
                <p className="text-xs text-soil-800/50">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
