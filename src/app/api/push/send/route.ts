import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.PUSH_SEND_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: string;
    body?: string;
    url?: string;
  };

  if (!body.title || !body.body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  try {
    const result = await sendPushToAll({
      title: body.title,
      body: body.body,
      url: body.url,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
