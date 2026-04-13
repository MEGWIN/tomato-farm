import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { notifySubscribed } from "@/lib/discord-log";

type Body = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // 既存購読か新規かを upsert 前に判定
  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", body.endpoint)
    .maybeSingle();
  const isNew = !existing;

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        user_agent: body.userAgent ?? null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 新規購読のみ Discord 通知
  if (isNew) {
    const { count } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true });
    await notifySubscribed({ userAgent: body.userAgent, total: count ?? 0 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as { endpoint: string };
  if (!body?.endpoint) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
