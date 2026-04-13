import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import { sendPushToAll } from "@/lib/push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;
const ALLOWED_CHANNEL_ID = process.env.DISCORD_ALLOWED_CHANNEL_ID;
const ALLOWED_USER_IDS = (process.env.DISCORD_ALLOWED_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function hexToUint8(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function verify(signature: string, timestamp: string, body: string): { ok: boolean; err?: string } {
  try {
    const msg = new TextEncoder().encode(timestamp + body);
    const sig = hexToUint8(signature);
    const key = hexToUint8(PUBLIC_KEY);
    const ok = nacl.sign.detached.verify(msg, sig, key);
    return { ok };
  } catch (err) {
    return { ok: false, err: err instanceof Error ? err.message : String(err) };
  }
}

type InteractionOption = {
  name: string;
  type: number;
  value?: string;
};

type Interaction = {
  type: number;
  data?: {
    name?: string;
    options?: InteractionOption[];
  };
  channel_id?: string;
  member?: { user?: { id: string; username?: string } };
  user?: { id: string; username?: string };
};

function getOpt(opts: InteractionOption[] | undefined, name: string): string | undefined {
  return opts?.find((o) => o.name === name)?.value;
}

function reply(content: string, ephemeral = true) {
  return NextResponse.json({
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content,
      flags: ephemeral ? 64 : 0, // EPHEMERAL: 本人だけに見える
    },
  });
}

export async function GET() {
  return NextResponse.json({
    publicKeySet: Boolean(PUBLIC_KEY),
    publicKeyLen: PUBLIC_KEY?.length || 0,
    publicKeyHead: PUBLIC_KEY ? PUBLIC_KEY.slice(0, 8) : null,
  });
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const rawBody = await req.text();

  console.log("discord POST:", {
    hasSignature: Boolean(signature),
    hasTimestamp: Boolean(timestamp),
    sigLen: signature?.length,
    bodyLen: rawBody.length,
    bodyHead: rawBody.slice(0, 80),
    pubKeyLen: PUBLIC_KEY?.length,
  });

  if (!signature || !timestamp) {
    return new NextResponse("missing headers", { status: 401 });
  }

  const result = verify(signature, timestamp, rawBody);

  // デバッグログは非同期で保存（レスポンス遅延させない）
  supabaseAdmin
    .from("discord_debug_logs")
    .insert({
      sig: signature,
      ts: timestamp,
      body: rawBody,
      pubkey_head: PUBLIC_KEY?.slice(0, 16) || null,
      verify_result: result.ok,
      verify_err: result.err || null,
    })
    .then(() => {})
    .catch(() => {});

  if (!result.ok) {
    return new NextResponse(
      JSON.stringify({
        error: "invalid request signature",
        debugErr: result.err,
        sigLen: signature.length,
        tsLen: timestamp.length,
        bodyLen: rawBody.length,
        pubKeyLen: PUBLIC_KEY.length,
      }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const interaction = JSON.parse(rawBody) as Interaction;

  // PING: Discord endpoint check
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // APPLICATION_COMMAND
  if (interaction.type !== 2) {
    return NextResponse.json({ error: "unsupported" }, { status: 400 });
  }

  // 認可: チャンネル制限
  if (ALLOWED_CHANNEL_ID && interaction.channel_id !== ALLOWED_CHANNEL_ID) {
    return reply("⚠️ このチャンネルでは使えないぜMAJIDE");
  }
  // 認可: ユーザー制限
  const userId = interaction.member?.user?.id || interaction.user?.id;
  if (ALLOWED_USER_IDS.length > 0 && (!userId || !ALLOWED_USER_IDS.includes(userId))) {
    return reply("⚠️ 権限ないぜMAJIDE");
  }

  const cmd = interaction.data?.name;
  const opts = interaction.data?.options;

  if (cmd === "push") {
    const title = getOpt(opts, "title");
    const body = getOpt(opts, "body");
    const url = getOpt(opts, "url");
    const at = getOpt(opts, "at");

    if (!title || !body) {
      return reply("title と body は必須だぜMAJIDE");
    }

    // 予約送信
    if (at) {
      const scheduledAt = parseScheduleTime(at);
      if (!scheduledAt) {
        return reply(
          `⚠️ 時刻の形式が読めないMAJIDE: \`${at}\`\n例: \`2026-04-13 20:00\` / \`30分後\` / \`今日20:00\``,
        );
      }
      const { error } = await supabaseAdmin.from("scheduled_pushes").insert({
        title,
        body,
        url: url || null,
        scheduled_at: scheduledAt.toISOString(),
      });
      if (error) return reply(`⚠️ 予約失敗: ${error.message}`);
      return reply(
        `📅 予約したぜMAJIDE\n**${scheduledAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}**\n${title}\n${body}`,
      );
    }

    // 即時送信
    try {
      const result = await sendPushToAll({ title, body, url });
      return reply(
        `✅ 送信完了MAJIDE (${result.sent}/${result.total} 成功, ${result.failed} 失敗)\n**${title}**\n${body}${url ? `\n${url}` : ""}`,
      );
    } catch (err) {
      return reply(`⚠️ 送信失敗: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  if (cmd === "push-list") {
    const { data, error } = await supabaseAdmin
      .from("scheduled_pushes")
      .select("id, title, scheduled_at")
      .is("sent_at", null)
      .order("scheduled_at", { ascending: true })
      .limit(20);
    if (error) return reply(`⚠️ ${error.message}`);
    if (!data || data.length === 0) return reply("📭 予約なしMAJIDE");
    const lines = data.map(
      (d) =>
        `**#${d.id}** ${new Date(d.scheduled_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} — ${d.title}`,
    );
    return reply(`📋 予約一覧\n${lines.join("\n")}`);
  }

  if (cmd === "push-cancel") {
    const id = getOpt(opts, "id");
    if (!id) return reply("id 必須MAJIDE");
    const { error } = await supabaseAdmin
      .from("scheduled_pushes")
      .delete()
      .eq("id", Number(id))
      .is("sent_at", null);
    if (error) return reply(`⚠️ ${error.message}`);
    return reply(`🗑️ #${id} キャンセルしたぜMAJIDE`);
  }

  return reply("⚠️ 知らないコマンドMAJIDE");
}

function parseScheduleTime(input: string): Date | null {
  const s = input.trim();
  const now = new Date();

  // "30分後" / "2時間後"
  const mAfter = s.match(/^(\d+)\s*分後$/);
  if (mAfter) return new Date(now.getTime() + Number(mAfter[1]) * 60_000);
  const hAfter = s.match(/^(\d+)\s*時間後$/);
  if (hAfter) return new Date(now.getTime() + Number(hAfter[1]) * 3_600_000);

  // "今日20:00" / "明日9:30"
  const dayWord = s.match(/^(今日|明日|明後日)\s*(\d{1,2})[:：](\d{2})$/);
  if (dayWord) {
    const offset = { 今日: 0, 明日: 1, 明後日: 2 }[dayWord[1] as "今日" | "明日" | "明後日"];
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(Number(dayWord[2]), Number(dayWord[3]), 0, 0);
    return d;
  }

  // "2026-04-13 20:00" (JST想定)
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2})[:：](\d{2})$/);
  if (iso) {
    // JSTとしてパースしてUTCに変換
    const jstMs = Date.UTC(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4]),
      Number(iso[5]),
    ) - 9 * 3_600_000;
    return new Date(jstMs);
  }

  return null;
}
