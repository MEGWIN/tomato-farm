import Link from "next/link";
import { siteConfig } from "@/config/site";
import NotificationButton from "@/components/pwa/NotificationButton";

export default function Footer() {
  return (
    <footer className="bg-soil-900 text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🍅</span>
              <span className="font-heading font-black text-xl text-tomato-400">
                {siteConfig.shortName}
              </span>
            </div>
            <p className="text-soil-200 text-sm leading-relaxed">
              {siteConfig.description}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-heading font-bold text-sunshine-400 mb-4">
              ページ
            </h3>
            <ul className="space-y-2">
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-soil-200 hover:text-tomato-400 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-heading font-bold text-sunshine-400 mb-4">
              リンク
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={siteConfig.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-soil-200 hover:text-tomato-400 transition-colors text-sm"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.social.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-soil-200 hover:text-tomato-400 transition-colors text-sm"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-soil-200 hover:text-tomato-400 transition-colors text-sm"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-soil-200 hover:text-tomato-400 transition-colors text-sm"
                >
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-soil-800 mt-8 pt-8 flex flex-col items-center gap-4">
          <div>
            <h3 className="font-heading font-bold text-sunshine-400 text-sm mb-3 text-center">
              更新通知を受け取る
            </h3>
            <NotificationButton />
          </div>
        </div>

        <div className="mt-8 pt-4 text-center text-soil-200 text-xs">
          <p>&copy; {new Date().getFullYear()} {siteConfig.author}. Powered by Claude &amp; Next.js</p>
        </div>
      </div>
    </footer>
  );
}
