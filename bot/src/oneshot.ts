import { Client, GatewayIntentBits, Partials } from "discord.js";
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

    // 文脈部とデータ部に分割（区切りは改行3個以上連続）
    const { context: articleContext, data: dataPart } = splitContextAndData(
      target.content
    );

    if (!articleContext) {
      await target.reply(
        "📝 写真と一緒にコメントも書いてね！（例: 今日は葉っぱが大きくなった）"
      );
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

    // データ部から3株の草丈を解決（絶対値→差分の順）
    const heightsByPlant = await resolveHeightsFromDataPart(dataPart);

    const todayEntryId = getTodayEntryId();

    if (todayEntryId) {
      // === 追記モード ===
      await target.reply("🍅 今日の記事に追記中...少し待ってね！");

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
      await target.reply(
        `✅ 今日の記事に追記したぜ！\n` + `🔗 確認はこちら → ${cmsEditUrl}`
      );
    } else {
      // === 新規作成モード ===
      await target.reply("🍅 記事を生成中...少し待ってね！");

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
