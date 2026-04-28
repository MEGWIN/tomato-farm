import { Client, GatewayIntentBits, Partials } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { generateArticle, generateAppendContent, extractHeightsFromComment } from "./generate-article";
import { postToCms, uploadImageToCms, getCmsEntry, updateCmsEntry, getLatestDayNumber } from "./post-to-cms";
import { getTodayEntryId, saveTodayEntryId } from "./today-entry";

config({ path: __dirname + "/../.env" });

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;
const REACTION_DONE = "✅";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/** JST基準の日付（朝4時境界）を取得 */
function getJstDateString(): string {
  const now = new Date();
  const jstMs = now.getTime() + 9 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000;
  const shifted = new Date(jstMs);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 栽培ログをSupabaseに保存（株ごとに1レコード）。
 * - heightsByPlant に書かれた株はそれぞれ INSERT
 * - 草丈ゼロ件のときは記事メタデータ用に1号だけ height_cm=null で INSERT
 * - diary_slug は書かれた中で最若番の plant_id にだけ付与
 */
async function saveCultivationLogs(
  day: number,
  heightsByPlant: Record<number, number>,
  slug: string | null,
  note: string | null
) {
  const today = getJstDateString();
  const writtenPlantIds = [1, 2, 3].filter((id) => heightsByPlant[id] != null);
  const plantsToSave = writtenPlantIds.length > 0 ? writtenPlantIds : [1];
  const slugPlantId = plantsToSave[0];

  const records = plantsToSave.map((plantId) => ({
    date: today,
    day_number: day,
    plant_id: plantId,
    height_cm: heightsByPlant[plantId] ?? null,
    diary_slug: plantId === slugPlantId ? slug : null,
    note: plantId === slugPlantId ? note : null,
  }));

  const { error } = await supabase.from("cultivation_logs").insert(records);
  if (error) {
    console.error("栽培ログ保存失敗:", error.message);
  } else {
    const summary = records
      .map((r) => `${r.plant_id}号:${r.height_cm ?? "なし"}cm`)
      .join(" / ");
    console.log("📊 栽培ログ保存完了: Day", day, summary);
  }
}

async function main() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Reaction],
  });

  await client.login(process.env.DISCORD_TOKEN);
  await new Promise<void>((resolve) => client.once("ready", resolve));
  console.log("🍅 ワンショットBot起動");

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error("❌ チャンネルが見つかりません");
      return;
    }

    // 最新メッセージを取得（Bot以外の投稿を探す）
    const messages = await channel.messages.fetch({ limit: 10 });
    const target = messages.find(
      (m) => !m.author.bot && m.attachments.some((a) => a.contentType?.startsWith("image/"))
    );

    if (!target) {
      console.log("📭 未処理の画像付きメッセージがありません");
      return;
    }

    // ✅リアクション済みならスキップ
    const doneReaction = target.reactions.cache.find((r) => r.emoji.name === REACTION_DONE);
    if (doneReaction && doneReaction.me) {
      console.log("✅ 最新メッセージは処理済みです");
      return;
    }

    const userText = target.content.trim();
    if (!userText) {
      await target.reply("📝 写真と一緒にコメントも書いてね！（例: 今日は葉っぱが大きくなった）");
      return;
    }

    const imageAttachments = target.attachments.filter((a) =>
      a.contentType?.startsWith("image/")
    );

    // 画像をmicroCMSにアップロード
    const cmsImageUrls: string[] = [];
    const discordImageUrls: string[] = [];
    for (const [, att] of imageAttachments) {
      console.log("📸 画像URL:", att.url);
      discordImageUrls.push(att.url);
      try {
        const uploaded = await uploadImageToCms(att.url, att.name ?? "photo.jpg");
        cmsImageUrls.push(uploaded);
      } catch (e) {
        console.error("画像アップロード失敗（スキップ）:", e);
      }
    }

    const todayEntryId = getTodayEntryId();

    if (todayEntryId) {
      // === 追記モード ===
      await target.reply("🍅 今日の記事に追記中...少し待ってね！");

      const existing = await getCmsEntry(todayEntryId);
      const existingBody = (existing.body as string) || "";

      const appendContent = await generateAppendContent(userText, discordImageUrls, existingBody);

      const imageTags = cmsImageUrls
        .map((url) => `<figure><img src="${url}" alt="栽培写真" /></figure>`)
        .join("\n");
      const wrappedImages =
        cmsImageUrls.length >= 2
          ? `<div class="image-grid">${imageTags}</div>`
          : imageTags;
      const updatedBody = existingBody + "\n<hr>\n" + appendContent.bodySection + "\n" + wrappedImages;

      await updateCmsEntry(todayEntryId, {
        body: updatedBody,
        claudeAnalysis: appendContent.claudeAnalysis,
        claudeAdvice: appendContent.claudeAdvice,
      });

      const cmsEditUrl = `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/apis/tomato/${todayEntryId}`;
      await target.reply(
        `✅ 今日の記事に追記したぜ！\n` +
        `🔗 確認はこちら → ${cmsEditUrl}`
      );
    } else {
      // === 新規作成モード ===
      await target.reply("🍅 記事を生成中...少し待ってね！");

      const latestDay = await getLatestDayNumber();
      const nextDay = latestDay + 1;

      const article = await generateArticle(userText, discordImageUrls, nextDay);

      const cmsResult = await postToCms({
        ...article,
        coverImageUrl: cmsImageUrls[0] ?? null,
        bodyImageUrls: cmsImageUrls,
      });

      saveTodayEntryId(cmsResult.id);

      const heightsByPlant = extractHeightsFromComment(userText);
      await saveCultivationLogs(
        nextDay,
        heightsByPlant,
        article.slug,
        null
      );

      const cmsEditUrl = `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/apis/tomato/${cmsResult.id}`;
      await target.reply(
        `✅ 記事を下書き保存したぜ！\n` +
        `📝 **${article.title}**\n` +
        `🔗 確認・公開はこちら → ${cmsEditUrl}`
      );
    }

    // 処理済みマーク
    await target.react(REACTION_DONE);
    console.log("🎉 処理完了！");

  } finally {
    client.destroy();
    console.log("👋 Bot終了");
  }
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
