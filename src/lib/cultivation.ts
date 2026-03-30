import { supabase } from "./supabase";

export interface CultivationLog {
  id: number;
  date: string;
  day_number: number;
  height_cm: number | null;
  diary_slug: string | null;
  note: string | null;
  created_at: string;
}

export interface CultivationStats {
  latestLog: CultivationLog | null;
  previousLog: CultivationLog | null;
  allLogs: CultivationLog[];
}

/** 栽培ログを全件取得（日付順） */
export async function getCultivationLogs(): Promise<CultivationLog[]> {
  const { data, error } = await supabase
    .from("cultivation_logs")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("栽培ログ取得失敗:", error.message);
    return [];
  }
  return data ?? [];
}

/** 栽培ステータスを取得（最新・前回・全ログ） */
export async function getCultivationStats(): Promise<CultivationStats> {
  const allLogs = await getCultivationLogs();

  // 草丈データがあるログだけフィルタ
  const logsWithHeight = allLogs.filter((l) => l.height_cm != null);

  const latestLog = logsWithHeight.length > 0
    ? logsWithHeight[logsWithHeight.length - 1]
    : allLogs.length > 0
      ? allLogs[allLogs.length - 1]
      : null;

  const previousLog = logsWithHeight.length > 1
    ? logsWithHeight[logsWithHeight.length - 2]
    : null;

  return { latestLog, previousLog, allLogs };
}
