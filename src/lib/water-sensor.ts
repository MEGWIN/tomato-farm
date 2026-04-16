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
