import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "..", "data");
const STATE_FILE = join(DATA_DIR, "today-entry.json");

type TodayState = {
  date: string; // "YYYY-MM-DD"
  entryId: string;
};

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
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
