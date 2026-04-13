// MEGWIN Service Worker — Web Push対応

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // PWAインストール要件を満たすための最小fetchリスナー
});

// Push受信
self.addEventListener("push", (event) => {
  let payload = { title: "MEGWIN", body: "新着情報があるぜMAJIDE", url: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // JSON以外は無視
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url || "/" },
    }),
  );
});

// 通知タップ
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      // 外部URL（YouTubeなど）はそのまま新規タブで開く
      const isExternal = /^https?:\/\//i.test(targetUrl) &&
        !targetUrl.startsWith(self.location.origin);

      if (isExternal) {
        await self.clients.openWindow(targetUrl);
        return;
      }

      // 同一オリジン: 既存タブがあればフォーカス、なければ新規
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
