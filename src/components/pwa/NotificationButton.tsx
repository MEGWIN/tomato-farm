"use client";

import { useEffect, useState } from "react";

type Status =
  | "loading"
  | "unsupported"
  | "ios-needs-install"
  | "idle"
  | "subscribed"
  | "working"
  | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari legacy
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function NotificationButton() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;

      const hasPush = "serviceWorker" in navigator && "PushManager" in window;

      if (!hasPush) {
        // iOS Safari タブ状態は PushManager なし
        if (isIOS() && !isStandalone()) {
          if (!cancelled) setStatus("ios-needs-install");
          return;
        }
        if (!cancelled) setStatus("unsupported");
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        setStatus(sub ? "subscribed" : "idle");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = async () => {
    setStatus("working");
    setMessage("");
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("VAPID public key missing");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("idle");
        setMessage("通知が許可されなかったぜMAJIDE");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error("save failed");

      setStatus("subscribed");
      setMessage("通知ONにしたぜMAJIDE");
    } catch {
      setStatus("error");
      setMessage("エラー出たぜMAJIDE");
    }
  };

  const unsubscribe = async () => {
    setStatus("working");
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("idle");
      setMessage("通知OFFにしたぜMAJIDE");
    } catch {
      setStatus("error");
      setMessage("エラー出たぜMAJIDE");
    }
  };

  if (status === "loading" || status === "unsupported") return null;

  if (status === "ios-needs-install") {
    return (
      <div className="rounded-lg border border-soil-700 bg-soil-800 p-4 text-soil-200 text-xs leading-relaxed">
        <p className="font-bold text-sunshine-400 mb-2">📱 iPhoneで通知を受け取るには</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>画面下の共有ボタンをタップ</li>
          <li>「ホーム画面に追加」を選ぶ</li>
          <li>ホーム画面のアイコンから起動</li>
          <li>もう一度この通知ボタンを押す</li>
        </ol>
      </div>
    );
  }

  const isSub = status === "subscribed";
  const working = status === "working";

  return (
    <div>
      <button
        type="button"
        onClick={isSub ? unsubscribe : subscribe}
        disabled={working}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${
          isSub
            ? "bg-soil-700 text-soil-200 hover:bg-soil-600"
            : "bg-tomato-500 text-white hover:bg-tomato-600"
        }`}
      >
        <span>{isSub ? "🔕" : "🔔"}</span>
        <span>{isSub ? "通知OFFにする" : "通知を受け取る"}</span>
      </button>
      {message && (
        <p className="mt-2 text-xs text-soil-300">{message}</p>
      )}
    </div>
  );
}
