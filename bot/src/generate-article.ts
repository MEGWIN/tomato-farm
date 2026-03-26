import { exec } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export type GeneratedArticle = {
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  day: number;
  category: string;
  claudeAnalysis: string;
  claudeAdvice: string;
};

export type AppendContent = {
  bodySection: string;
  claudeAnalysis: string;
  claudeAdvice: string;
};

export async function generateArticle(
  userComment: string,
  imageUrl: string
): Promise<GeneratedArticle> {
  const prompt = `
あなたはプチトマト水耕栽培ブログの記事生成AIです。以下の情報から栽培日記の記事を生成してください。

## MEGWINのコメント
${userComment}

## 写真URL（参考情報）
${imageUrl}

## 出力ルール
以下のJSON形式で出力してください。JSON以外のテキストは一切出力しないでください。

### MEGWINパート（body）の文体:
- 一人称は「オレ」（カタカナ）
- 語尾は「〜だぜ」「〜するぜ」「〜じゃん」系
- 短文テンポ、「！」多用
- 最後に「MAJIDE」を入れる
- HTMLタグ（<p>, <h2>, <ul>, <li>等）で記述

### Claude先生パート（claudeAnalysis）:
- 植物の専門家として分析
- 「現状分析」と「注意点」を含める
- HTMLタグで記述

### claudeAdvice:
- 次にやるべきことを1文で簡潔に

### JSON形式:
{
  "title": "Day N - タイトル",
  "slug": "day-n-english-slug",
  "body": "<p>MEGWIN口調の本文HTML</p>",
  "excerpt": "1行の概要文",
  "day": 数字,
  "category": "daily",
  "claudeAnalysis": "<p>Claude先生の分析HTML</p>",
  "claudeAdvice": "次への指示1文"
}

categoryは以下から選択: daily, experiment, trouble, harvest, setup

JSONのみを出力:
`.trim();

  console.log("🤖 Claude Code CLIで記事生成中...");

  // CLAUDECODE環境変数を除外（ネスト防止）
  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;

  // プロンプトを一時ファイルに書き出し（Windowsコマンドライン文字数制限回避）
  const tmpFile = join(tmpdir(), `claude-prompt-${Date.now()}.txt`);
  writeFileSync(tmpFile, prompt, "utf-8");

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Claude CLI タイムアウト (120秒)"));
      }, 120000);

      exec(
        `type "${tmpFile}" | claude -p`,
        {
          env: cleanEnv,
          maxBuffer: 1024 * 1024,
          timeout: 120000,
        },
        (error, stdout, stderr) => {
          clearTimeout(timer);
          if (error) reject(new Error(`Claude CLI failed: ${error.message}`));
          else resolve(stdout);
        }
      );
    });

    // JSON部分を抽出
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Claude CLIの出力からJSONを抽出できませんでした: " + stdout.slice(0, 200));
    }

    const article: GeneratedArticle = JSON.parse(jsonMatch[0]);

    // バリデーション
    if (!article.title || !article.slug || !article.body) {
      throw new Error("生成された記事に必須フィールドがありません");
    }

    console.log("✅ 記事生成完了:", article.title);
    return article;
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

/** 既存記事への追記セクションを生成 */
export async function generateAppendContent(
  userComment: string,
  imageUrl: string,
  existingBody: string
): Promise<AppendContent> {
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  const prompt = `
あなたはプチトマト水耕栽培ブログの追記セクション生成AIです。
今日すでに記事が投稿されています。新しい報告を追記セクションとして生成してください。

## 既存の記事本文
${existingBody}

## MEGWINの新しいコメント
${userComment}

## 写真URL（参考情報）
${imageUrl}

## 出力ルール
以下のJSON形式で出力してください。JSON以外のテキストは一切出力しないでください。

### bodySection（追記する本文セクション）:
- 時刻見出し「<h3>🕐 ${timeStr} の報告</h3>」で始める
- 一人称は「オレ」（カタカナ）
- 語尾は「〜だぜ」「〜するぜ」「〜じゃん」系
- 短文テンポ、「！」多用
- 最後に「MAJIDE」を入れる
- HTMLタグ（<p>, <h2>, <ul>, <li>等）で記述
- 既存の本文と重複しない新しい内容を書く

### claudeAnalysis:
- 既存の記事と今回の報告を総合的に分析
- 植物の専門家として「現状分析」と「注意点」を含める
- HTMLタグで記述

### claudeAdvice:
- 今日の全報告を踏まえた次にやるべきことを1文で

### JSON形式:
{
  "bodySection": "<h3>🕐 ${timeStr} の報告</h3><p>追記本文HTML</p>",
  "claudeAnalysis": "<p>総合分析HTML</p>",
  "claudeAdvice": "次への指示1文"
}

JSONのみを出力:
`.trim();

  console.log("🤖 Claude Code CLIで追記セクション生成中...");

  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;

  const tmpFile = join(tmpdir(), `claude-prompt-${Date.now()}.txt`);
  writeFileSync(tmpFile, prompt, "utf-8");

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Claude CLI タイムアウト (120秒)"));
      }, 120000);

      exec(
        `type "${tmpFile}" | claude -p`,
        {
          env: cleanEnv,
          maxBuffer: 1024 * 1024,
          timeout: 120000,
        },
        (error, stdout) => {
          clearTimeout(timer);
          if (error) reject(new Error(`Claude CLI failed: ${error.message}`));
          else resolve(stdout);
        }
      );
    });

    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Claude CLIの出力からJSONを抽出できませんでした: " + stdout.slice(0, 200));
    }

    const content: AppendContent = JSON.parse(jsonMatch[0]);

    if (!content.bodySection) {
      throw new Error("生成された追記にbodySectionがありません");
    }

    console.log("✅ 追記セクション生成完了");
    return content;
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}
