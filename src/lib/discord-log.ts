// Discord Webhook通知ヘルパー（購読ログ用）

const WEBHOOK_URL = process.env.DISCORD_LOG_WEBHOOK_URL;

function shortenUA(ua: string | null | undefined): string {
  if (!ua) return "不明";
  // 主要ブラウザ・OSを簡易抽出
  const isIPhone = /iPhone/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMac = /Macintosh/i.test(ua) && !isIPhone;
  const isWin = /Windows/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isEdge = /Edg/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);

  const os = isIPhone ? "iPhone" : isAndroid ? "Android" : isMac ? "Mac" : isWin ? "Windows" : "Unknown OS";
  const browser = isEdge ? "Edge" : isChrome ? "Chrome" : isSafari ? "Safari" : isFirefox ? "Firefox" : "Browser";
  return `${os} / ${browser}`;
}

export async function notifySubscribed(opts: { userAgent?: string | null; total: number }) {
  if (!WEBHOOK_URL) return;
  const device = shortenUA(opts.userAgent);
  const content = `🆕 **新しい購読者MAJIDE**\nデバイス: ${device}\n合計: **${opts.total}人**`;
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }).catch(() => {});
}

