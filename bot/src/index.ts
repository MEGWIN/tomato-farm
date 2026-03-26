import { Client, GatewayIntentBits, Partials, type Message } from "discord.js";
import { config } from "dotenv";
import { generateArticle, generateAppendContent } from "./generate-article";
import { postToCms, uploadImageToCms, getCmsEntry, updateCmsEntry } from "./post-to-cms";
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
  const imageAttachment = message.attachments.find((a) =>
    a.contentType?.startsWith("image/")
  );
  if (!imageAttachment) return;

  const userText = message.content.trim();
  if (!userText) {
    await message.reply("📝 写真と一緒にコメントも書いてね！（例: 今日は葉っぱが大きくなった）");
    return;
  }

  try {
    // 1. 画像をダウンロードしてmicroCMSにアップロード
    const imageUrl = imageAttachment.url;
    console.log("📸 画像URL:", imageUrl);

    let cmsImageUrl: string | null = null;
    try {
      cmsImageUrl = await uploadImageToCms(imageUrl, imageAttachment.name ?? "photo.jpg");
    } catch (e) {
      console.error("画像アップロード失敗（記事は画像なしで続行）:", e);
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
      const appendContent = await generateAppendContent(userText, imageUrl, existingBody);

      // 本文を結合（<hr>で区切り）
      const imageTag = cmsImageUrl
        ? `<figure><img src="${cmsImageUrl}" alt="栽培写真" /></figure>`
        : "";
      const updatedBody = existingBody + "\n<hr>\n" + imageTag + appendContent.bodySection;

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

      // Claude Code CLIで記事生成
      const article = await generateArticle(userText, imageUrl);

      // microCMSに下書き投稿
      const cmsResult = await postToCms({
        ...article,
        coverImageUrl: cmsImageUrl,
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
