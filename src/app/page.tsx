import HeroSection from "@/components/home/HeroSection";
import LatestArticles from "@/components/home/LatestArticles";
import SensorPlaceholder from "@/components/home/SensorPlaceholder";

export default function Home() {
  return (
    <>
      <HeroSection />
      <LatestArticles />
      <SensorPlaceholder />

      {/* Claude先生ティーザー */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-leaf-50 to-leaf-100 rounded-2xl p-8 md:p-12 border border-leaf-200/50 shadow-md">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl md:text-7xl shrink-0">🩺</div>
              <div>
                <h2 className="font-heading font-black text-2xl md:text-3xl text-leaf-700 mb-3">
                  Claude先生のトマト診察室
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
    </>
  );
}
