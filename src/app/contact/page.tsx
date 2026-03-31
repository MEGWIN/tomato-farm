"use client";

import { useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const CATEGORIES = [
  "コラボ依頼",
  "取材・出演依頼",
  "ビジネス提携",
  "その他",
] as const;

type FormData = {
  name: string;
  email: string;
  category: string;
  message: string;
};

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    category: CATEGORIES[0],
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("送信に失敗しました");

      setStatus("sent");
      setForm({ name: "", email: "", category: CATEGORIES[0], message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-6xl mb-6">📩</div>
          <h1 className="font-heading font-black text-3xl text-soil-900 mb-4">
            送信完了！
          </h1>
          <p className="text-soil-800/70 text-lg mb-8">
            お問い合わせありがとうございます。
            <br />
            内容を確認のうえ、折り返しご連絡いたします。
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="bg-tomato-500 text-white font-bold px-8 py-3 rounded-full hover:bg-tomato-600 transition"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading font-black text-4xl md:text-5xl text-soil-900 mb-4">
            お問い合わせ
          </h1>
          <p className="text-soil-800/70 text-lg mb-4">
            コラボ・取材・ビジネスのご相談はこちらから
          </p>
          <a
            href="/form/gundan"
            className="inline-block text-tomato-500 hover:text-tomato-700 font-bold transition"
          >
            MEGWIN軍団希望者はこちら →
          </a>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 md:p-10 shadow-md border border-tomato-100/50 space-y-6"
        >
          {/* 名前 */}
          <div>
            <label
              htmlFor="name"
              className="block font-heading font-bold text-soil-900 mb-2"
            >
              お名前 <span className="text-tomato-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="山田太郎"
              className="w-full px-4 py-3 rounded-xl border border-soil-200 bg-soil-50 text-soil-800 placeholder-soil-800/30 focus:outline-none focus:ring-2 focus:ring-tomato-400 focus:border-transparent transition"
            />
          </div>

          {/* メール */}
          <div>
            <label
              htmlFor="email"
              className="block font-heading font-bold text-soil-900 mb-2"
            >
              メールアドレス <span className="text-tomato-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-soil-200 bg-soil-50 text-soil-800 placeholder-soil-800/30 focus:outline-none focus:ring-2 focus:ring-tomato-400 focus:border-transparent transition"
            />
          </div>

          {/* 種別 */}
          <div>
            <label
              htmlFor="category"
              className="block font-heading font-bold text-soil-900 mb-2"
            >
              お問い合わせ種別
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-soil-200 bg-soil-50 text-soil-800 focus:outline-none focus:ring-2 focus:ring-tomato-400 focus:border-transparent transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* メッセージ */}
          <div>
            <label
              htmlFor="message"
              className="block font-heading font-bold text-soil-900 mb-2"
            >
              お問い合わせ内容 <span className="text-tomato-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              value={form.message}
              onChange={handleChange}
              placeholder="お問い合わせ内容をご記入ください"
              className="w-full px-4 py-3 rounded-xl border border-soil-200 bg-soil-50 text-soil-800 placeholder-soil-800/30 focus:outline-none focus:ring-2 focus:ring-tomato-400 focus:border-transparent transition resize-y"
            />
          </div>

          {/* エラー */}
          {status === "error" && (
            <p className="text-tomato-600 text-sm font-bold">
              送信に失敗しました。時間をおいて再度お試しください。
            </p>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full bg-tomato-500 text-white font-bold py-4 rounded-xl hover:bg-tomato-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
          >
            {status === "sending" ? "送信中..." : "送信する"}
          </button>
        </form>

      </div>
    </div>
  );
}
