import { supabase } from "./supabase";

export interface CultivationLog {
  id: number;
  date: string;
  day_number: number;
  height_cm: number | null;
  diary_slug: string | null;
  note: string | null;
  created_at: string;
  plant_id: number;
}

export interface PlantStats {
  plantId: number;
  latestLog: CultivationLog | null;
  previousLog: CultivationLog | null;
  logs: CultivationLog[];
}

export interface CultivationStats {
  plants: PlantStats[];
  allLogs: CultivationLog[];
}

export const PLANT_IDS = [1, 2, 3] as const;

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

/** 株ごとに最新・前回・ログを集計 */
export async function getCultivationStats(): Promise<CultivationStats> {
  const allLogs = await getCultivationLogs();

  const plants: PlantStats[] = PLANT_IDS.map((plantId) => {
    const logs = allLogs.filter((l) => l.plant_id === plantId);
    const logsWithHeight = logs.filter((l) => l.height_cm != null);
    const latestLog =
      logsWithHeight.length > 0
        ? logsWithHeight[logsWithHeight.length - 1]
        : logs.length > 0
          ? logs[logs.length - 1]
          : null;
    const previousLog =
      logsWithHeight.length > 1
        ? logsWithHeight[logsWithHeight.length - 2]
        : null;
    return { plantId, latestLog, previousLog, logs };
  });

  return { plants, allLogs };
}
