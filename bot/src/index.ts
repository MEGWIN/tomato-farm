import { Client, GatewayIntentBits, Partials, type Message } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import {
  generateArticle,
  generateAppendContent,
  extractHeightsFromComment,
  extractAllPlantsDelta,
  splitContextAndData,
} from "./generate-article";
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

/** 各株の最新草丈（height_cm IS NOT NULL）を取得 */
async function getLatestHeights(): Promise<Record<number, number>> {
  const result: Record<number, number> = {};
  for (const plantId of [1, 2, 3]) {
    const { data } = await supabase
      .from("cultivation_logs")
      .select("height_cm")
      .eq("plant_id", plantId)
      .not("height_cm", "is", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);
    const cm = data?.[0]?.height_cm;
    if (cm != null) result[plantId] = cm as number;
  }
  return result;
}

/**
 * データ部から3株の草丈を解決する。
 * 1. 絶対値抽出（「1号50cm 2号45cm」）を試す
 * 2. 空なら差分抽出（「ともに+2cm」）を試して各株の直近草丈+delta
 * 3. 過去レコードがない株はスキップ
 */
async function resolveHeightsFromDataPart(
  dataPart: string
): Promise<Record<number, number>> {
  const direct = extractHeightsFromComment(dataPart);
  if (Object.keys(direct).length > 0) return direct;

  const delta = extractAllPlantsDelta(dataPart);
  if (delta == null) return {};

  const latest = await getLatestHeights();
  const result: Record<number, number> = {};
  for (const plantId of [1, 2, 3]) {
    if (latest[plantId] != null) {
      result[plantId] = +(latest[plantId] + delta).toFixed(2);
    }
  }
  return result;
}

/** データ部から収穫コマンドを処理（マッチした場合は処理してtrueを返す） */
async function processHarvestFromDataPart(
  message: Message,
  dataPart: string
): Promise<boolean> {
  const harvestParsed = parseHarvest(dataPart);
  if (!harvestParsed || !/収穫|とれた|採れた/.test(dataPart)) return false;

  const today = getJstDateString();
  const { error } = await supabase.from("harvests").insert({
    plant_id: harvestParsed.plantId,
    date: today,
    count: harvestParsed.count,
  });
  if (error) {
    await message.reply(`❌ 収穫の保存に失敗: ${error.message}`);
    return true;
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
  return true;
}

client.on("messageCreate", async (message: Message) => {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // 指定チャンネルのみ
  if (message.channelId !== CHANNEL_ID) return;

  const imageAttachments = message.attachments.filter((a) =>
    a.contentType?.startsWith("image/")
  );
  const hasImages = imageAttachments.size > 0;

  // 画像なし: 全文をデータ部として扱い、収穫コマンドのみ処理
  if (!hasImages) {
    await processHarvestFromDataPart(message, message.content);
    return;
  }

  // 画像あり: 文脈部とデータ部に分割（区切りは改行3個以上連続）
  const { context: articleContext, data: dataPart } = splitContextAndData(
    message.content
  );

  if (!articleContext) {
    await message.reply(
      "📝 写真と一緒にコメントも書いてね！（例: 今日は葉っぱが大きくなった）"
    );
    return;
  }

  // データ部に収穫コマンドがあれば処理
  await processHarvestFromDataPart(message, dataPart);

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

    // 2. データ部から3株の草丈を解決（絶対値→差分の順）
    const heightsByPlant = await resolveHeightsFromDataPart(dataPart);

    // 3. 今日すでにエントリがあるか確認
    const todayEntryId = getTodayEntryId();

    if (todayEntryId) {
      // === 追記モード ===
      await message.reply("🍅 今日の記事に追記中...少し待ってね！");

      const existing = await getCmsEntry(todayEntryId);
      const existingBody = (existing.body as string) || "";

      const appendContent = await generateAppendContent(
        articleContext,
        discordImageUrls,
        existingBody
      );

      const imageTags = cmsImageUrls
        .map((url) => `<figure><img src="${url}" alt="栽培写真" /></figure>`)
        .join("\n");
      const wrappedImages =
        cmsImageUrls.length >= 2
          ? `<div class="image-grid">${imageTags}</div>`
          : imageTags;
      const updatedBody =
        existingBody + "\n<hr>\n" + appendContent.bodySection + "\n" + wrappedImages;

      await updateCmsEntry(todayEntryId, {
        body: updatedBody,
        claudeAnalysis: appendContent.claudeAnalysis,
        claudeAdvice: appendContent.claudeAdvice,
      });

      // 追記モードでもデータ部に草丈があれば既存ログをUPSERT
      if (Object.keys(heightsByPlant).length > 0) {
        const today = getJstDateString();
        const { data: todayLogs } = await supabase
          .from("cultivation_logs")
          .select("day_number")
          .eq("date", today)
          .limit(1);
        const dayNumber = todayLogs?.[0]?.day_number;
        if (dayNumber) {
          for (const [plantIdStr, cm] of Object.entries(heightsByPlant)) {
            await upsertCultivationLogHeight(
              dayNumber,
              parseInt(plantIdStr, 10),
              cm
            );
          }
        }
      }

      const cmsEditUrl = `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/apis/tomato/${todayEntryId}`;
      await message.reply(
        `✅ 今日の記事に追記したぜ！\n` + `🔗 確認はこちら → ${cmsEditUrl}`
      );
    } else {
      // === 新規作成モード ===
      await message.reply("🍅 記事を生成中...少し待ってね！");

      const latestDay = await getLatestDayNumber();
      const nextDay = latestDay + 1;

      const article = await generateArticle(articleContext, discordImageUrls, nextDay);

      const cmsResult = await postToCms({
        ...article,
        coverImageUrl: cmsImageUrls[0] ?? null,
        bodyImageUrls: cmsImageUrls,
      });

      saveTodayEntryId(cmsResult.id);

      await saveCultivationLogs(nextDay, heightsByPlant, article.slug, null);

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
