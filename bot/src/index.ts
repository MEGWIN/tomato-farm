import { Client, GatewayIntentBits, Partials, type Message } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { generateArticle, generateAppendContent } from "./generate-article";
import { postToCms, uploadImageToCms, getCmsEntry, updateCmsEntry, getLatestDayNumber } from "./post-to-cms";
import { getTodayEntryId, saveTodayEntryId } from "./today-entry";

config({ path: __dirname + "/../.env" });

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;

// Supabase client (anon key - RLS allows insert/update on cultivation_logs)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message],
});

client.once("ready", () => {
  console.log(`🍅 Bot起動: ${client.user?.tag}`);
});

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

/** 栽培ログをSupabaseに保存 */
async function saveCultivationLog(
  day: number,
  heightCm: number | null,
  slug: string | null,
  note: string | null
) {
  const today = getJstDateString();
  const { error } = await supabase.from("cultivation_logs").insert({
    date: today,
    day_number: day,
    height_cm: heightCm,
    diary_slug: slug,
    note,
  });
  if (error) {
    console.error("栽培ログ保存失敗:", error.message);
  } else {
    console.log("📊 栽培ログ保存完了: Day", day, heightCm ? `${heightCm}cm` : "(草丈なし)");
  }
}

/** 栽培ログの草丈を更新 */
async function updateCultivationLogHeight(day: number, heightCm: number) {
  const today = getJstDateString();
  const { error } = await supabase
    .from("cultivation_logs")
    .update({ height_cm: heightCm })
    .eq("date", today)
    .eq("day_number", day);
  if (error) {
    console.error("草丈更新失敗:", error.message);
  } else {
    console.log("📏 草丈更新完了:", heightCm, "cm");
  }
}

/** Discordで草丈を質問し、返答を待つ */
async function askForHeight(message: Message, day: number) {
  await message.channel.send("📏 今日の草丈は何cm？（例: 27、スキップするなら「なし」）");

  try {
    const collected = await message.channel.awaitMessages({
      filter: (m) => m.author.id === message.author.id,
      max: 1,
      time: 120_000, // 2分待つ
    });

    const reply = collected.first();
    if (!reply) return;

    const text = reply.content.trim();
    if (text === "なし" || text === "スキップ") {
      await reply.reply("👌 草丈の記録はスキップしたぜ！");
      return;
    }

    // テキストから数値を抽出（「大体27cmかな」「27」「27cm」等に対応）
    const numMatch = text.match(/(\d+(?:\.\d+)?)/);
    const height = numMatch ? parseFloat(numMatch[1]) : NaN;
    if (isNaN(height) || height <= 0 || height > 1000) {
      await reply.reply("🤔 数値が読み取れなかったぜ...次回でOK！");
      return;
    }

    await updateCultivationLogHeight(day, height);
    await reply.reply(`✅ 草丈 ${height}cm を記録したぜ！`);
  } catch {
    // タイムアウト - 何もしない
    console.log("草丈質問タイムアウト（スキップ）");
  }
}

/** 全角→半角の数字変換 */
function normalizeDigits(s: string): string {
  return s.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

/** 「1号5個収穫」のようなメッセージをパース */
function parseHarvest(text: string): { plantId: number; count: number } | null {
  const t = normalizeDigits(text);
  const m = t.match(/(\d+)\s*号[^0-9]*?(\d+)\s*個/);
  if (!m) return null;
  const plantId = parseInt(m[1], 10);
  const count = parseInt(m[2], 10);
  if (![1, 2, 3].includes(plantId)) return null;
  if (count <= 0 || count > 1000) return null;
  return { plantId, count };
}

client.on("messageCreate", async (message: Message) => {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // 指定チャンネルのみ
  if (message.channelId !== CHANNEL_ID) return;

  // 収穫コマンド: 「1号5個収穫」など（画像不要）
  const harvestParsed = parseHarvest(message.content);
  if (harvestParsed && /収穫|とれた|採れた/.test(message.content)) {
    const today = getJstDateString();
    const { error } = await supabase.from("harvests").insert({
      plant_id: harvestParsed.plantId,
      date: today,
      count: harvestParsed.count,
    });
    if (error) {
      await message.reply(`❌ 収穫の保存に失敗: ${error.message}`);
      return;
    }
    const { data: totals } = await supabase
      .from("harvests")
      .select("count")
      .eq("plant_id", harvestParsed.plantId);
    const total = (totals ?? []).reduce(
      (sum, r) => sum + (r.count as number),
      0
    );
    await message.reply(
      `🍅 ${harvestParsed.plantId}号 ${harvestParsed.count}個 収穫を記録したぜ！\n` +
        `累計: ${total}個`
    );
    return;
  }

  // 画像がない場合は無視
  const imageAttachments = message.attachments.filter((a) =>
    a.contentType?.startsWith("image/")
  );
  if (imageAttachments.size === 0) return;

  const userText = message.content.trim();
  if (!userText) {
    await message.reply("📝 写真と一緒にコメントも書いてね！（例: 今日は葉っぱが大きくなった）");
    return;
  }

  try {
    // 1. 全画像をダウンロードしてmicroCMSにアップロード
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

    // 2. 今日すでにエントリがあるか確認
    const todayEntryId = getTodayEntryId();

    if (todayEntryId) {
      // === 追記モード ===
      await message.reply("🍅 今日の記事に追記中...少し待ってね！");

      // 既存エントリを取得
      const existing = await getCmsEntry(todayEntryId);
      const existingBody = (existing.body as string) || "";

      // Claude CLIで追記セクション生成
      const appendContent = await generateAppendContent(userText, discordImageUrls, existingBody);

      // 本文を結合（<hr>で区切り、画像はテキストの後ろ）
      const imageTags = cmsImageUrls
        .map((url) => `<figure><img src="${url}" alt="栽培写真" /></figure>`)
        .join("\n");
      const wrappedImages =
        cmsImageUrls.length >= 2
          ? `<div class="image-grid">${imageTags}</div>`
          : imageTags;
      const updatedBody = existingBody + "\n<hr>\n" + appendContent.bodySection + "\n" + wrappedImages;

      // microCMSを更新
      await updateCmsEntry(todayEntryId, {
        body: updatedBody,
        claudeAnalysis: appendContent.claudeAnalysis,
        claudeAdvice: appendContent.claudeAdvice,
      });

      const cmsEditUrl = `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/apis/tomato/${todayEntryId}`;
      await message.reply(
        `✅ 今日の記事に追記したぜ！\n` +
        `🔗 確認はこちら → ${cmsEditUrl}`
      );
    } else {
      // === 新規作成モード ===
      await message.reply("🍅 記事を生成中...少し待ってね！");

      // 最新Day番号を取得して次の番号を決定
      const latestDay = await getLatestDayNumber();
      const nextDay = latestDay + 1;

      // Claude Code CLIで記事生成
      const article = await generateArticle(userText, discordImageUrls, nextDay);

      // microCMSに下書き投稿
      const cmsResult = await postToCms({
        ...article,
        coverImageUrl: cmsImageUrls[0] ?? null,
        bodyImageUrls: cmsImageUrls,
      });

      // 今日のエントリIDを保存
      saveTodayEntryId(cmsResult.id);

      // 栽培ログをSupabaseに保存
      await saveCultivationLog(
        nextDay,
        article.heightCm,
        article.slug,
        null
      );

      const cmsEditUrl = `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/apis/tomato/${cmsResult.id}`;
      await message.reply(
        `✅ 記事を下書き保存したぜ！\n` +
        `📝 **${article.title}**\n` +
        `🔗 確認・公開はこちら → ${cmsEditUrl}`
      );

      // 草丈が取れなかった場合、Discordで質問
      if (article.heightCm == null) {
        await askForHeight(message, nextDay);
      }
    }
  } catch (error) {
    console.error("記事生成エラー:", error);
    await message.reply("❌ エラーが発生しました: " + (error as Error).message);
  }
});

client.login(process.env.DISCORD_TOKEN);
