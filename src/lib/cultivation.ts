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

export interface Harvest {
  id: number;
  plant_id: number;
  date: string;
  count: number;
  note: string | null;
  created_at: string;
}

export interface CultivationStats {
  plants: PlantStats[];
  allLogs: CultivationLog[];
  harvestTotals: Record<number, number>;
  harvestToday: Record<number, number>;
}

/** JST基準の今日の日付（YYYY-MM-DD） */
function getJstToday(): string {
  const now = new Date();
  const jstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const shifted = new Date(jstMs);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

/** 収穫累計と当日合計を株ごとに取得 */
export async function getHarvestSummary(): Promise<{
  totals: Record<number, number>;
  today: Record<number, number>;
}> {
  const { data, error } = await supabase
    .from("harvests")
    .select("plant_id, count, date");
  if (error) {
    console.error("収穫取得失敗:", error.message);
    return { totals: {}, today: {} };
  }
  const totals: Record<number, number> = {};
  const today: Record<number, number> = {};
  const todayStr = getJstToday();
  for (const row of (data ?? []) as Pick<Harvest, "plant_id" | "count" | "date">[]) {
    totals[row.plant_id] = (totals[row.plant_id] ?? 0) + row.count;
    if (row.date === todayStr) {
      today[row.plant_id] = (today[row.plant_id] ?? 0) + row.count;
    }
  }
  return { totals, today };
}

/** 株ごとに最新・前回・ログを集計 */
export async function getCultivationStats(): Promise<CultivationStats> {
  const [allLogs, harvest] = await Promise.all([
    getCultivationLogs(),
    getHarvestSummary(),
  ]);
  const harvestTotals = harvest.totals;
  const harvestToday = harvest.today;

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

  return { plants, allLogs, harvestTotals, harvestToday };
}
