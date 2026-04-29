import { supabase } from "./supabase";

export interface WaterSensorLog {
  id: number;
  created_at: string;
  plant_id: number;
  water_temp: number | null;
  tds_ppm: number | null;
  water_level_cm: number | null;
  device_id: string | null;
}

/** 指定株の最新1件を取得 */
export async function getLatestWaterSensor(
  plantId: number,
): Promise<WaterSensorLog | null> {
  const { data, error } = await supabase
    .from("water_sensor_logs")
    .select("*")
    .eq("plant_id", plantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("最新センサー取得失敗:", error.message);
    return null;
  }
  return (data as WaterSensorLog | null) ?? null;
}

/** 指定株の直近 hours 時間分のログを時系列順で取得 */
export async function getWaterSensorHistory(
  plantId: number,
  hours = 24,
): Promise<WaterSensorLog[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("water_sensor_logs")
    .select("*")
    .eq("plant_id", plantId)
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("センサー履歴取得失敗:", error.message);
    return [];
  }
  return (data ?? []) as WaterSensorLog[];
}

/** 容器の高さ（cm）— 水位 = CONTAINER_HEIGHT - 超音波距離 */
export const CONTAINER_HEIGHT_CM = 18;

/** 水位を残量パーセントに変換 */
export function waterLevelPercent(levelCm: number | null): number | null {
  if (levelCm == null) return null;
  const pct = Math.round((levelCm / CONTAINER_HEIGHT_CM) * 100);
  return Math.max(0, Math.min(100, pct));
}

export interface HourlyAverage {
  /** バケットの基準時刻（JST毎時00分に対応するUTC ms） */
  hourMs: number;
  water_temp: number | null;
  tds_ppm: number | null;
}

/**
 * 10分刻みの生ログを JST 1時間バケットに集約して平均値を返す。
 * 給水時にセンサーを持ち上げた異常値（TDS が極端に低い）は除外する。
 */
export function aggregateHourlyAverage(
  logs: WaterSensorLog[],
  options: { tdsMinValid?: number } = {},
): HourlyAverage[] {
  const tdsMin = options.tdsMinValid ?? 600;
  const buckets = new Map<number, { temps: number[]; tdss: number[] }>();

  for (const log of logs) {
    const utcMs = new Date(log.created_at).getTime();
    // JSTで毎時00分にフロアしたUTC ms をバケットキーにする
    const jstMs = utcMs + 9 * 60 * 60 * 1000;
    const jstHourFloorMs = Math.floor(jstMs / 3_600_000) * 3_600_000;
    const bucketKey = jstHourFloorMs - 9 * 60 * 60 * 1000;

    let bucket = buckets.get(bucketKey);
    if (!bucket) {
      bucket = { temps: [], tdss: [] };
      buckets.set(bucketKey, bucket);
    }

    if (log.tds_ppm != null) {
      const tds = Number(log.tds_ppm);
      // しきい値未満は給水時の持ち上げ等の異常値として除外
      if (tds >= tdsMin) bucket.tdss.push(tds);
    }
    if (log.water_temp != null) {
      bucket.temps.push(Number(log.water_temp));
    }
  }

  const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hourMs, b]) => ({
      hourMs,
      water_temp: b.temps.length > 0 ? Number(avg(b.temps).toFixed(2)) : null,
      tds_ppm: b.tdss.length > 0 ? Math.round(avg(b.tdss)) : null,
    }));
}
