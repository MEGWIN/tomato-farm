import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function processQueue() {
  // 時刻が過ぎてて未送信のものを取得
  const { data: due, error } = await supabaseAdmin
    .from("scheduled_pushes")
    .select("id, title, body, url")
    .is("sent_at", null)
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (error) throw new Error(`fetch scheduled failed: ${error.message}`);
  if (!due || due.length === 0) return { processed: 0 };

  const results = [];
  for (const item of due) {
    try {
      const result = await sendPushToAll({
        title: item.title,
        body: item.body,
        url: item.url || undefined,
      });
      await supabaseAdmin
        .from("scheduled_pushes")
        .update({
          sent_at: new Date().toISOString(),
          sent_count: result.sent,
          failed_count: result.failed,
        })
        .eq("id", item.id);
      results.push({ id: item.id, ok: true, ...result });
    } catch (err) {
      results.push({
        id: item.id,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return { processed: due.length, results };
}

function authOk(req: Request) {
  const secret = process.env.PUSH_SEND_SECRET;
  const auth = req.headers.get("authorization");
  return Boolean(secret) && auth === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await processQueue();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  // pg_cronから呼べるようGETもサポート（同じ認証）
  return POST(req);
}
