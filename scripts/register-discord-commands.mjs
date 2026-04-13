// Discord Slash Command 登録スクリプト
// 使い方:
//   DISCORD_APP_ID=xxx DISCORD_BOT_TOKEN=xxx DISCORD_GUILD_ID=xxx node scripts/register-discord-commands.mjs
// または .env.local を読み込む場合:
//   node --env-file=.env.local scripts/register-discord-commands.mjs

const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // 省略時はグローバル登録

if (!APP_ID || !BOT_TOKEN) {
  console.error("DISCORD_APP_ID と DISCORD_BOT_TOKEN が必要だぜMAJIDE");
  process.exit(1);
}

const commands = [
  {
    name: "push",
    description: "Web Push通知を送信（即時 or 予約）",
    options: [
      { name: "title", description: "通知タイトル", type: 3, required: true },
      { name: "body", description: "本文", type: 3, required: true },
      { name: "url", description: "タップ先URL（YouTubeライブ等）", type: 3, required: false },
      { name: "at", description: "予約時刻 例: 2026-04-13 20:00 / 30分後 / 今日20:00", type: 3, required: false },
    ],
  },
  {
    name: "push-list",
    description: "予約中のPush一覧",
    options: [],
  },
  {
    name: "push-stats",
    description: "購読者数・予約件数・直近送信を表示",
    options: [],
  },
  {
    name: "push-cancel",
    description: "予約中のPushをキャンセル",
    options: [
      { name: "id", description: "予約ID（push-listで確認）", type: 3, required: true },
    ],
  },
];

const endpoint = GUILD_ID
  ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

const res = await fetch(endpoint, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error("登録失敗:", res.status, await res.text());
  process.exit(1);
}

console.log(`✅ ${GUILD_ID ? "ギルド" : "グローバル"}コマンド登録完了MAJIDE`);
console.log(JSON.stringify(await res.json(), null, 2));
