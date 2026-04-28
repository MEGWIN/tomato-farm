import { Client, GatewayIntentBits, Partials, type Message } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { generateArticle, generateAppendContent, extractHeightsFromComment } from "./generate-article";
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

/**
 * 栽培ログをSupabaseに保存（株ごとに1レコード）。
 * - heightsByPlant に書かれた株はそれぞれ INSERT
 * - 草丈ゼロ件のときは記事メタデータ用に1号だけ height_cm=null で INSERT
 * - diary_slug は書かれた中で最若番の plant_id にだけ付与（草丈ゼロなら1号）
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

/** 指定株の草丈をUPSERT（既存があればUPDATE、なければINSERT） */
async function upsertCultivationLogHeight(
  day: number,
  plantId: number,
  heightCm: number
) {
  const today = getJstDateString();
  const { data: existing } = await supabase
    .from("cultivation_logs")
    .select("id")
    .eq("date", today)
    .eq("day_number", day)
    .eq("plant_id", plantId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cultivation_logs")
      .update({ height_cm: heightCm })
      .eq("id", existing.id);
    if (error) console.error(`${plantId}号草丈更新失敗:`, error.message);
    else console.log(`📏 ${plantId}号草丈更新: ${heightCm}cm`);
  } else {
    const { error } = await supabase.from("cultivation_logs").insert({
      date: today,
      day_number: day,
      plant_id: plantId,
      height_cm: heightCm,
    });
    if (error) console.error(`${plantId}号草丈追加失敗:`, error.message);
    else console.log(`📏 ${plantId}号草丈追加: ${heightCm}cm`);
  }
}

/** Discordで草丈を質問し、返答を待つ（3株対応） */
async function askForHeights(message: Message, day: number) {
  await message.channel.send(
    "📏 今日の草丈は？（例: `1号3cm 2号5cm 3号4cm`、全部スキップなら「なし」）"
  );

  try {
    const collected = await message.channel.awaitMessages({
      filter: (m) => m.author.id === message.author.id,
      max: 1,
      time: 120_000,
    });

    const reply = collected.first();
    if (!reply) return;

    const text = reply.content.trim();
    if (text === "なし" || text === "スキップ") {
      await reply.reply("👌 草丈の記録はスキップしたぜ！");
      return;
    }

    const heights = extractHeightsFromComment(text);
    const entries = Object.entries(heights);
    if (entries.length === 0) {
      await reply.reply("🤔 草丈が読み取れなかったぜ...次回でOK！（例: 1号3cm 2号5cm 3号4cm）");
      return;
    }

    for (const [plantIdStr, cm] of entries) {
      await upsertCultivationLogHeight(day, parseInt(plantIdStr, 10), cm);
    }

    const summary = entries.map(([id, cm]) => `${id}号${cm}cm`).join(" / ");
    await reply.reply(`✅ 草丈記録: ${summary}`);
  } catch {
    console.log("草丈質問タイムアウト（スキップ）");
  }
}

/** 全角→半角の数字変換 */
function normalizeDigits(s: string): string {
  return s.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

/** 「1号5個収穫」のようなメッセージをパース（収穫専用、草丈の cm パターンは除外） */
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

      // コメントから3株分の草丈を抽出
      const heightsByPlant = extractHeightsFromComment(userText);

      // 栽培ログをSupabaseに保存（株ごとに1レコード）
      await saveCultivationLogs(
        nextDay,
        heightsByPlant,
        article.slug,
        null
      );

      const cmsEditUrl = `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/apis/tomato/${cmsResult.id}`;
      await message.reply(
        `✅ 記事を下書き保存したぜ！\n` +
        `📝 **${article.title}**\n` +
        `🔗 確認・公開はこちら → ${cmsEditUrl}`
      );

      // 3株とも草丈が取れなかった場合のみDiscordで質問
      if (Object.keys(heightsByPlant).length === 0) {
        await askForHeights(message, nextDay);
      }
    }
  } catch (error) {
    console.error("記事生成エラー:", error);
    await message.reply("❌ エラーが発生しました: " + (error as Error).message);
  }
});

client.login(process.env.DISCORD_TOKEN);
