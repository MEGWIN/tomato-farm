import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-tomato-600 via-tomato-500 to-orange-500 text-white">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-sunshine-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-tomato-800/30 rounded-full blur-3xl" />
        {/* Floating tomatoes */}
        <span className="absolute top-[10%] right-[15%] text-6xl animate-float opacity-30">
          🍅
        </span>
        <span
          className="absolute bottom-[20%] left-[10%] text-4xl animate-float opacity-20"
          style={{ animationDelay: "1s" }}
        >
          🍅
        </span>
        <span
          className="absolute top-[40%] right-[40%] text-5xl animate-float opacity-15"
          style={{ animationDelay: "2s" }}
        >
          🌱
        </span>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-20 text-center">
        {/* Title */}
        <h1 className="font-heading font-black text-4xl md:text-6xl lg:text-7xl leading-tight mb-6 drop-shadow-lg">
          オレがオレに
          <br />
          <span className="text-sunshine-300">オンデマンド</span>
          <br />
          MEGWINだ！
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
          <span className="font-heading font-bold text-sunshine-300 text-2xl md:text-3xl">AI×インタラクティブ</span>
          <br />
          Media Entertainment Group — WIN
          <br />
          映像を、体験へ。
          <br />
          今までできなかったことをAIとやる。
          <br />
          それが<strong>MEGWIN</strong>だ！
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-2 bg-white text-tomato-600 font-heading font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            About Us
          </Link>
          <Link
            href="/diary"
            className="inline-flex items-center justify-center gap-2 bg-white text-tomato-600 font-heading font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            🍅 栽培日記を読む
          </Link>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 50C240 90 480 10 720 50C960 90 1200 10 1440 50V100H0V50Z"
            fill="var(--color-soil-50)"
          />
        </svg>
      </div>
    </section>
  );
}
