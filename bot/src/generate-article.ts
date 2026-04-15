import { exec } from "child_process";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { getCurrentWeather, formatWeatherForPrompt } from "./weather";

export type GeneratedArticle = {
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  day: number;
  category: string;
  claudeAnalysis: string;
  claudeAdvice: string;
  heightCm: number | null;
};

export type AppendContent = {
  bodySection: string;
  claudeAnalysis: string;
  claudeAdvice: string;
};

/** Discord画像をダウンロードして一時ファイルに保存 */
async function downloadImageToTmp(url: string, index: number): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`画像ダウンロード失敗 (${response.status}): ${url}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 拡張子を判定
    const contentType = response.headers.get("content-type") || "image/jpeg";
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("gif")) ext = "gif";
    else if (contentType.includes("webp")) ext = "webp";

    const tmpDir = join(tmpdir(), "tomato-bot-images");
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

    const filePath = join(tmpDir, `photo-${Date.now()}-${index}.${ext}`);
    writeFileSync(filePath, buffer);
    console.log(`📸 画像保存: ${filePath} (${buffer.length} bytes)`);
    return filePath;
  } catch (error) {
    console.error(`画像ダウンロード例外: ${url}`, error);
    return null;
  }
}

/** 一時画像ファイルを削除 */
function cleanupTmpImages(paths: string[]) {
  for (const p of paths) {
    try { unlinkSync(p); } catch {}
  }
}

export async function generateArticle(
  userComment: string,
  imageUrls: string[],
  nextDay: number
): Promise<GeneratedArticle> {
  let weatherLine = "";
  try {
    const weather = await getCurrentWeather();
    weatherLine = `\n## 今日の八王子の天気\n${formatWeatherForPrompt(weather)}\n`;
  } catch (e) {
    console.error("天気取得失敗（天気なしで続行）:", e);
  }

  // Discord画像を一時ファイルにダウンロード
  const tmpImagePaths: string[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const path = await downloadImageToTmp(imageUrls[i], i);
    if (path) tmpImagePaths.push(path);
  }

  const hasImages = tmpImagePaths.length > 0;
  const imageSection = hasImages
    ? `## 添付写真（以下のファイルパスの画像を読み取って分析してください）\n${tmpImagePaths.join("\n")}\n\n上記の写真を注意深く観察し、トマトの生育状態（葉の色・形・大きさ、茎の太さ、花や実の有無、全体の健康状態）を分析に活用してください。\n\n**重要: 個体識別について**\n- 鉢・支柱・プランターに「1」「2」「3」などの番号札（白い紙の手書き数字など）が貼られている場合、それは個体番号（1号・2号・3号）を示す\n- 番号札が見える場合は、**どの号の個体の写真か**を明示し、個体ごとに生育状態を記述すること（例:「1号は花が咲いた」「2号は葉が黄ばんでる」）\n- 複数の個体が写っている場合は、それぞれ区別して言及する\n- 番号札が見えない場合は無理に番号を推測しない\n`
    : "";

  const prompt = `
あなたはプチトマト水耕栽培ブログの記事生成AIです。以下の情報から栽培日記の記事を生成してください。

## MEGWINのコメント
${userComment}

${imageSection}${weatherLine}

## 今回の記事番号
Day ${nextDay}（この番号を必ず使用してください。変更しないでください。）

## 出力ルール
以下のJSON形式で出力してください。JSON以外のテキストは一切出力しないでください。

### MEGWINパート（body）の文体:
- **冒頭は必ず「オレがオレにオンデマンド!○○MEGWINだ!!」で始める**
  - ○○には季節・天気・記事内容に合った短いMEGWINを肯定するフレーズを入れる
  - 例: 「イケメンMEGWIN」「桜に合うMEGWIN」「平和大好きMEGWIN」「トマト育てるMEGWIN」
- 一人称は「オレ」（カタカナ）。「俺」「私」「僕」は使わない
- **基本は常体**（「〜だよ」「〜じゃん」「〜だろ」）。敬体（です・ます）は使わない
- 語尾は「〜だぜ」「〜するぜ」「〜じゃん」「〜いくぞ」「〜しかねぇ」系
- 短文テンポ、「！」多用
- 最後に「MAJIDE」を入れる
- NGワード: 「頑張ります」「感謝」「夢に向かって」「w」は禁止
- HTMLタグ（<p>, <h2>, <ul>, <li>等）で記述
- 天気情報がある場合、本文中で自然に触れる（例: 「今日は快晴で25℃！トマト日和だぜ！」）
${hasImages ? "- **写真で見えるトマトの様子を具体的に描写する**（例: 「見てくれよこの葉っぱ！めちゃくちゃ青々としてるじゃねぇか！」）" : ""}

### Claude先生パート（claudeAnalysis）:
- 植物の専門家として分析${hasImages ? "\n- **添付写真を目視で分析し、葉の色合い・茎の状態・成長具合・病害虫の兆候などを具体的に言及する**" : ""}
- 「現状分析」と「注意点」を含める
- 天気情報がある場合、気温・湿度が栽培に与える影響にも触れる
- **300文字程度に収める（簡潔に要点だけ）**
- HTMLタグで記述

### claudeAdvice:
- 次にやるべきことを1文で簡潔に

### heightCm（草丈の数値抽出）:
- MEGWINのコメントや文脈から草丈（cm）が読み取れる場合、その数値を入れる${hasImages ? "\n- 写真から草丈を推定できる場合もその情報を参考にする" : ""}
- 例: 「50cmくらいになった」→ 50、「だいぶ大きくなった」→ null
- 数値が不明な場合は null

### JSON形式:
{
  "title": "タイトル",
  "slug": "day-${nextDay}-english-slug",
  "body": "<p>MEGWIN口調の本文HTML</p>",
  "excerpt": "1行の概要文",
  "day": ${nextDay},
  "category": "daily",
  "claudeAnalysis": "<p>Claude先生の分析HTML</p>",
  "claudeAdvice": "次への指示1文",
  "heightCm": null
}

categoryは以下から選択: daily, experiment, trouble, harvest, setup

JSONのみを出力:`.trim();

  console.log("🤖 Claude Code CLIで記事生成中...(画像解析あり)");

  // CLAUDECODE環境変数を除外（ネスト防止）
  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;

  // claude CLI のパスを解決（node.exe + cli.js をフルパスで指定）
  const nodeExe = "C:\\Program Files\\nodejs\\node.exe";
  const claudeCli = join(process.env.APPDATA || "", "npm", "node_modules", "@anthropic-ai", "claude-code", "cli.js");

  // プロンプトを一時ファイルに書き出し
  const tmpFile = join(tmpdir(), `claude-prompt-${Date.now()}.txt`);
  writeFileSync(tmpFile, prompt, "utf-8");

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Claude CLI タイムアウト (180秒)"));
      }, 180000);

      exec(
        `type "${tmpFile}" | "${nodeExe}" "${claudeCli}" -p --allowedTools "Read"`,
        {
          env: cleanEnv,
          maxBuffer: 1024 * 1024,
          timeout: 180000,
        },
        (error, stdout, stderr) => {
          clearTimeout(timer);
          if (error) reject(new Error(`Claude CLI failed: ${error.message}\nSTDERR: ${stderr}`));
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

    // Day番号をmicroCMSから取得した正しい値で強制上書き
    article.day = nextDay;

    // バリデーション
    if (!article.title || !article.slug || !article.body) {
      throw new Error("生成された記事に必須フィールドがありません");
    }

    console.log("✅ 記事生成完了:", article.title);
    return article;
  } finally {
    try { unlinkSync(tmpFile); } catch {}
    cleanupTmpImages(tmpImagePaths);
  }
}

/** 既存記事への追記セクションを生成 */
export async function generateAppendContent(
  userComment: string,
  imageUrls: string[],
  existingBody: string
): Promise<AppendContent> {
  const now = new Date();
  const jstHours = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCHours();
  const jstMinutes = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCMinutes();
  const timeStr = `${jstHours}:${String(jstMinutes).padStart(2, "0")}`;

  let weatherLine = "";
  try {
    const weather = await getCurrentWeather();
    weatherLine = `\n## 現在の八王子の天気\n${formatWeatherForPrompt(weather)}\n`;
  } catch (e) {
    console.error("天気取得失敗（天気なしで続行）:", e);
  }

  // Discord画像を一時ファイルにダウンロード
  const tmpImagePaths: string[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const path = await downloadImageToTmp(imageUrls[i], i);
    if (path) tmpImagePaths.push(path);
  }

  const hasImages = tmpImagePaths.length > 0;
  const imageSection = hasImages
    ? `## 添付写真（以下のファイルパスの画像を読み取って分析してください）\n${tmpImagePaths.join("\n")}\n\n上記の写真を注意深く観察し、トマトの現在の状態を分析に活用してください。\n\n**重要: 個体識別について**\n- 鉢・支柱・プランターに「1」「2」「3」などの番号札（白い紙の手書き数字など）が貼られている場合、それは個体番号（1号・2号・3号）を示す\n- 番号札が見える場合は、**どの号の個体の写真か**を明示し、個体ごとに生育状態を記述すること\n- 複数の個体が写っている場合は、それぞれ区別して言及する\n- 番号札が見えない場合は無理に番号を推測しない\n`
    : "";

  const prompt = `
あなたはプチトマト水耕栽培ブログの追記セクション生成AIです。
今日すでに記事が投稿されています。新しい報告を追記セクションとして生成してください。

## 既存の記事本文
${existingBody}

## MEGWINの新しいコメント
${userComment}

${imageSection}${weatherLine}

## 出力ルール
以下のJSON形式で出力してください。JSON以外のテキストは一切出力しないでください。

### bodySection（追記する本文セクション）:
- 時刻見出し「<h3>🕐 ${timeStr} の報告</h3>」で始める
- 一人称は「オレ」（カタカナ）。「俺」「私」「僕」は使わない
- **基本は常体**（「〜だよ」「〜じゃん」「〜だろ」）。敬体（です・ます）は使わない
- 語尾は「〜だぜ」「〜するぜ」「〜じゃん」「〜いくぞ」「〜しかねぇ」系
- 短文テンポ、「！」多用
- 最後に「MAJIDE」を入れる
- NGワード: 「頑張ります」「感謝」「夢に向かって」「w」は禁止
- HTMLタグ（<p>, <h2>, <ul>, <li>等）で記述
- 既存の本文と重複しない新しい内容を書く
- 天気情報がある場合、自然に触れる
${hasImages ? "- **写真で見えるトマトの様子を具体的に描写する**" : ""}

### claudeAnalysis:
- 既存の記事と今回の報告を総合的に分析
- 植物の専門家として「現状分析」と「注意点」を含める${hasImages ? "\n- **添付写真を目視で分析し、葉の色・茎の状態・成長具合・病害虫の兆候などを具体的に言及する**" : ""}
- 天気情報がある場合、気温・湿度が栽培に与える影響にも触れる
- **300文字程度に収める（簡潔に要点だけ）**
- HTMLタグで記述

### claudeAdvice:
- 今日の全報告を踏まえた次にやるべきことを1文で

### JSON形式:
{
  "bodySection": "<h3>🕐 ${timeStr} の報告</h3><p>追記本文HTML</p>",
  "claudeAnalysis": "<p>総合分析HTML</p>",
  "claudeAdvice": "次への指示1文"
}

JSONのみを出力:`.trim();

  console.log("🤖 Claude Code CLIで追記セクション生成中...(画像解析あり)");

  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;

  const nodeExe2 = "C:\\Program Files\\nodejs\\node.exe";
  const claudeCli2 = join(process.env.APPDATA || "", "npm", "node_modules", "@anthropic-ai", "claude-code", "cli.js");

  const tmpFile = join(tmpdir(), `claude-prompt-${Date.now()}.txt`);
  writeFileSync(tmpFile, prompt, "utf-8");

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Claude CLI タイムアウト (180秒)"));
      }, 180000);

      exec(
        `type "${tmpFile}" | "${nodeExe2}" "${claudeCli2}" -p --allowedTools "Read"`,
        {
          env: cleanEnv,
          maxBuffer: 1024 * 1024,
          timeout: 180000,
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
    cleanupTmpImages(tmpImagePaths);
  }
}
