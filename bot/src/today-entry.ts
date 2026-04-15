import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "..", "data");
const STATE_FILE = join(DATA_DIR, "today-entry.json");

type TodayState = {
  date: string; // "YYYY-MM-DD"
  entryId: string;
};

/**
 * JST基準で「今日」の日付文字列を返す。
 * 日付変更線は朝4時JST（深夜0〜4時は前日扱い）。
 */
function getTodayDateString(): string {
  const now = new Date();
  // UTC→JST変換（+9h）してから4時間引く → 朝4時が日付境界
  const jstMs = now.getTime() + 9 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000;
  const shifted = new Date(jstMs);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 今日のエントリIDを取得（なければnull） */
export function getTodayEntryId(): string | null {
  try {
    const data: TodayState = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    if (data.date === getTodayDateString()) {
      return data.entryId;
    }
  } catch {
    // ファイルなし or パースエラー → null
  }
  return null;
}

/** 今日のエントリIDを保存 */
export function saveTodayEntryId(entryId: string): void {
  mkdirSync(DATA_DIR, { recursive: true });
  const state: TodayState = {
    date: getTodayDateString(),
    entryId,
  };
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}
