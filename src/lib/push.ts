import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushToAll(payload: PushPayload) {
  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error) throw new Error(`fetch subs failed: ${error.message}`);
  if (!subs || subs.length === 0) return { sent: 0, failed: 0, total: 0 };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
  });

  let sent = 0;
  let failed = 0;
  const invalidIds: number[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 410 Gone / 404 Not Found → 無効な購読なので削除
        if (statusCode === 410 || statusCode === 404) {
          invalidIds.push(s.id as number);
        }
      }
    }),
  );

  if (invalidIds.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("id", invalidIds);
  }

  return { sent, failed, total: subs.length };
}
