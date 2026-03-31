export const revalidate = 60;

import Link from "next/link";
import HeroSection from "@/components/home/HeroSection";
import CultivationDashboard from "@/components/home/CultivationDashboard";
import LatestArticles from "@/components/home/LatestArticles";
export default function Home() {
  return (
    <>
      <HeroSection />
      <CultivationDashboard />
      <LatestArticles />

      {/* 軍団募集セクション - RPG風 */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 md:p-12 text-center overflow-hidden shadow-lg">
            {/* スキャンライン */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)'
            }} />
            <div className="relative z-10">
              <p className="text-purple-300 text-sm mb-4">2026年内YouTube登録者 再100万人を目指して</p>
              <h2 className="font-heading font-black text-2xl md:text-4xl mb-2 text-sunshine-300" style={{ textShadow: '0 0 20px rgba(255,204,0,0.3)' }}>
                オレとの冒険に出るのは誰だ
              </h2>
              <p className="font-heading font-black text-xl md:text-2xl text-white/90 mb-6">
                MEGWIN軍団募集中！
              </p>
              <div className="text-4xl mb-6">⚔️📖⚔️</div>
              <div className="flex justify-center">
                <Link
                  href="/form/gundan"
                  className="inline-flex items-center justify-center gap-2 bg-sunshine-300 text-purple-900 font-heading font-bold text-lg px-8 py-4 rounded-full hover:scale-105 transition-all shadow-lg"
                >
                  ▶ 冒険に参加する
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
