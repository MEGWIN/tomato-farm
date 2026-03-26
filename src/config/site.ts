export const siteConfig = {
  name: "MEGWIN公式サイト",
  shortName: "MEGWIN",
  description:
    "YouTubeパイオニアMEGWINの公式サイト。ギミックストリーム共同代表として、プログラミング×電子工作×ライブ配信を融合した「体験型ストリーミング」を手がけている。",
  url: "https://megwin.com",
  ogImage: "/images/og-image.png",
  author: "MEGWIN",
  location: "八王子市",
  navigation: [
    { label: "トップ", href: "/" },
    { label: "栽培日記", href: "/diary" },
    { label: "About", href: "/about" },
  ],
  social: {
    youtube: "https://www.youtube.com/megwin",
    x: "https://x.com/megwintv",
    instagram: "https://www.instagram.com/megwintvmegwin/",
    facebook: "https://www.facebook.com/megwintvofficial/",
  },
} as const;
