import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AffiliateTools from "@/components/home/AffiliateTools";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "MEGWINとAIが本気で遊ぶプロジェクト。インタラクティブ配信「Gimmick Stream」とAI監督トマト水耕栽培の紹介。",
};

export default function AboutPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-heading font-black text-4xl md:text-5xl text-soil-900 mb-4">
            About Us
          </h1>
          <p className="text-soil-800/70 text-lg">
            MEGWINとAIが本気で遊ぶプロジェクトたち
          </p>
        </div>

        {/* What is this */}
        <section className="mb-16">
          <h2 className="font-heading font-black text-3xl text-soil-900 text-center mb-10">
            今動いてるプロジェクト
          </h2>
          <div className="space-y-8">
            {/* Gimmick Stream */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 md:p-12 shadow-lg">
              <h3 className="font-heading font-black text-2xl md:text-3xl mb-6">
                🎮 Gimmick Stream
              </h3>
              <p className="text-white/90 leading-relaxed text-lg">
                今までできなかった視聴者とのインタラクティブライブを実現するプロジェクト。
              </p>
              <p className="text-white/90 leading-relaxed text-lg mt-4">
                これまでは、オンデマンド動画の中で軍団員がMEGWINに何かをする――それが限界だった。
                でもAIの力で、視聴者が直接MEGWINに何かできるようになって、その限界を突破した。
                リアルタイムでMEGWINをいじり倒せるギミックを、これからもどんどん開発していく。
              </p>
              <p className="text-white/90 leading-relaxed text-lg mt-4">
                ただ、MEGWINは過激なのが好きだから体力が持たない。
                ここを新しい軍団員でなんとかしたい。
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <a
                  href="https://gimmickstream.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-purple-700 font-bold px-6 py-3 rounded-full hover:bg-white/90 transition"
                >
                  gimmickstream.com
                </a>
                <Link
                  href="/form/gundan"
                  className="inline-block bg-yellow-400 text-purple-900 font-bold px-6 py-3 rounded-full hover:bg-yellow-300 transition"
                >
                  軍団員に応募する
                </Link>
              </div>
            </div>

            {/* トマトプロジェクト */}
            <div className="bg-gradient-to-r from-tomato-500 to-orange-500 text-white rounded-2xl p-8 md:p-12 shadow-lg">
              <h3 className="font-heading font-black text-2xl md:text-3xl mb-6">
                🍅 トマトプロジェクト
              </h3>
              <p className="text-white/90 leading-relaxed text-lg">
                GimmickStreamでよく水のギミックを作っていたMEGWINが、
                「もっとこの水を活かせないかな」ということで始めた水耕栽培プロジェクト。
                「<strong>水のMEGWIN</strong>」という異名の延長線上にある。
              </p>
              <p className="text-white/90 leading-relaxed text-lg mt-4">
                ただ、MEGWINは面倒くさがりで飽きっぽくて、はっきり言って農業には向いてない。
                だから<strong>Chloe先生</strong>が必要。
                リアルタイムでMEGWINにどんどん指示を出して、
                基本的にはMEGWINが何も考えなくてもトマトが育っていく――それが理想。
              </p>
              <ul className="text-white/90 text-lg mt-4 space-y-1 list-disc list-inside">
                <li>ESP32で栽培環境を自動化</li>
                <li>Discord BotでAIが世話を催促</li>
                <li>写真からAIが生育状態を診断</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="font-heading font-black text-3xl text-soil-900 text-center mb-10">
            MEGWIN軍団メンバー
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
                YouTubeのパイオニア / アホ
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
                Chloe先生(AI)
              </h3>
              <p className="text-leaf-600 font-bold text-sm mb-4">
                AI栽培アドバイザー
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
            {/* ○○WIN */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-purple-200/50 text-center">
              <div className="w-24 h-24 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center">
                <span className="text-5xl font-heading font-black text-purple-400">？</span>
              </div>
              <h3 className="font-heading font-black text-xl text-soil-900 mb-2">
                新軍団員
              </h3>
              <p className="text-purple-500 font-bold text-sm mb-4">
                Mと馬が合う奴
              </p>
              <p className="text-soil-800/70 text-sm leading-relaxed">
                マニュアルなんて存在しない！MEGWINは何も教えてくれない！指をくわえて見てるだけのお前は必要ない！お前は、なんでここに来ようとしているんだ？明確な意志、それを掲げろ！
              </p>
            </div>
          </div>
        </section>

        {/* 栽培メンバー */}
        <section className="mb-16">
          <h2 className="font-heading font-black text-3xl text-soil-900 text-center mb-10">
            <span className="text-leaf-500 mr-2">🌱</span>栽培メンバー
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: "プチトマト１", emoji: "🍅" },
              { name: "プチトマト２", emoji: "🍅" },
              { name: "プチトマト３", emoji: "🍅" },
            ].map((plant) => (
              <div
                key={plant.name}
                className="text-center p-4 rounded-xl bg-soil-50 border border-leaf-100"
              >
                <span className="text-3xl block mb-2">{plant.emoji}</span>
                <p className="font-heading font-bold text-sm text-soil-900">
                  {plant.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* リタイアメンバー（追悼） */}
        <section className="mb-16">
          <h2 className="font-heading font-black text-3xl text-soil-900 text-center mb-3">
            <span className="mr-2">🪦</span>リタイアメンバー
          </h2>
          <p className="text-center text-soil-800/60 text-sm mb-8">追悼</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: "バジル１", emoji: "🌿", cause: "凍死" },
              { name: "バジル２", emoji: "🌿", cause: "凍死" },
              { name: "バジル３", emoji: "🌿", cause: "凍死" },
            ].map((plant) => (
              <div
                key={plant.name}
                className="text-center p-4 rounded-xl bg-soil-100/50 border border-soil-200 grayscale opacity-70"
              >
                <span className="text-3xl block mb-2">{plant.emoji}</span>
                <p className="font-heading font-bold text-sm text-soil-900">
                  {plant.name}
                </p>
                <p className="text-xs text-soil-800/60 mt-1">{plant.cause}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 使ってる道具 */}
        <AffiliateTools />

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
              { icon: "/images/tech/raspberrypi.svg", name: "Raspberry Pi", desc: "IoTモニタリング" },
              { icon: "/images/tech/python.svg", name: "Python", desc: "データ収集・処理" },
              { icon: "/images/tech/openmeteo.svg", name: "Open-Meteo", desc: "天気API" },
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
