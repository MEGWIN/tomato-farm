import { Client, GatewayIntentBits, Partials, type Message } from "discord.js";
import { config } from "dotenv";
import { generateArticle, generateAppendContent } from "./generate-article";
import { postToCms, uploadImageToCms, getCmsEntry, updateCmsEntry, getLatestDayNumber } from "./post-to-cms";
import { getTodayEntryId, saveTodayEntryId } from "./today-entry";

config({ path: __dirname + "/../.env" });

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;

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

client.on("messageCreate", async (message: Message) => {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // 指定チャンネルのみ
  if (message.channelId !== CHANNEL_ID) return;

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

      const cmsEditUrl = `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/apis/tomato/${cmsResult.id}`;
      await message.reply(
        `✅ 記事を下書き保存したぜ！\n` +
        `📝 **${article.title}**\n` +
        `🔗 確認・公開はこちら → ${cmsEditUrl}`
      );
    }
  } catch (error) {
    console.error("記事生成エラー:", error);
    await message.reply("❌ エラーが発生しました: " + (error as Error).message);
  }
});

client.login(process.env.DISCORD_TOKEN);
