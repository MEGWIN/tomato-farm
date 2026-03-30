export const revalidate = 60;

import HeroSection from "@/components/home/HeroSection";
import CultivationDashboard from "@/components/home/CultivationDashboard";
import LatestArticles from "@/components/home/LatestArticles";
import AffiliateTools from "@/components/home/AffiliateTools";

export default function Home() {
  return (
    <>
      <HeroSection />
      <CultivationDashboard />
      <LatestArticles />
      <AffiliateTools />

      {/* Chloe先生ティーザー */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-leaf-50 to-leaf-100 rounded-2xl p-8 md:p-12 border border-leaf-200/50 shadow-md">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img src="/images/chloe.png" alt="Chloe先生" className="w-16 h-16 md:w-20 md:h-20 rounded-full shrink-0" />
              <div>
                <h2 className="font-heading font-black text-2xl md:text-3xl text-leaf-700 mb-3">
                  Chloe先生のトマト診察室
                </h2>
                <p className="text-soil-800/80 leading-relaxed mb-4">
                  毎日の栽培日記には、AIによる成長分析・未来予測・栽培アドバイスが付きます。
                  写真からの健康診断、気象データからの先手アドバイス、そして収量最大化のための具体的指示。
                </p>
                <p className="font-heading font-bold text-leaf-600">
                  「素人×AIで1,000個収穫」を本気で目指します！
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 軍団募集セクション */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-sunshine-400 via-sunshine-500 to-orange-500 rounded-2xl p-8 md:p-12 shadow-lg text-white text-center">
            <h2 className="font-heading font-black text-3xl md:text-4xl mb-4">
              MEGWIN軍団、募集中だぜ！
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-6 max-w-2xl mx-auto">
              オレと一緒に「体験型ストリー��ング」を盛り上げてくれる仲間を探してる！
              プログラミング、電子工作、配信、なんでもOK。
              やる気があるヤツ、いくぞ！
            </p>
            <p className="text-2xl font-heading font-black mb-8">
              よろしく頼むぜMAJIDE！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.youtube.com/megwin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-sunshine-600 font-heading font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                YouTubeをチェック
              </a>
              <a
                href="https://x.com/megwintv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-heading font-bold text-lg px-8 py-4 rounded-full border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                Xでつながる
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
