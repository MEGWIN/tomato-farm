import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { notifySensorAlert } from "@/lib/discord-log";

type IngestBody = {
  plant_id: number;
  water_temp?: number | null;
  tds_ppm?: number | null;
  water_level_cm?: number | null;
  device_id?: string | null;
};

const TDS_ALERT_THRESHOLD = 1400; // ppm 未満で警報
const WATER_LEVEL_ALERT_THRESHOLD = 3; // cm 未満で水位警報

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.SENSOR_INGEST_TOKEN ?? ""}`;
  if (!process.env.SENSOR_INGEST_TOKEN || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: IngestBody;
  try {
    body = (await req.json()) as IngestBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!isFiniteNumber(body.plant_id) || body.plant_id < 1 || body.plant_id > 99) {
    return NextResponse.json({ error: "invalid plant_id" }, { status: 400 });
  }

  // 異常値フィルタ: DS18B20の85°C（電源投入時デフォルト値）、TDS 0ppm（センサー未接触）
  const rawTemp = isFiniteNumber(body.water_temp) ? body.water_temp : null;
  const rawTds = isFiniteNumber(body.tds_ppm) ? Math.round(body.tds_ppm) : null;

  const row = {
    plant_id: Math.round(body.plant_id),
    water_temp: rawTemp != null && rawTemp !== 85 ? rawTemp : null,
    tds_ppm: rawTds != null && rawTds > 0 ? rawTds : null,
    water_level_cm: isFiniteNumber(body.water_level_cm) ? body.water_level_cm : null,
    device_id: typeof body.device_id === "string" ? body.device_id.slice(0, 64) : null,
  };

  // 直前のレコードを取得（警報状態の変化検知用）
  const { data: prev } = await supabase
    .from("water_sensor_logs")
    .select("tds_ppm, water_level_cm")
    .eq("plant_id", row.plant_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("water_sensor_logs").insert(row);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TDS警報: 前回が正常 → 今回下回った / 前回警報 → 今回復旧
  if (row.tds_ppm != null) {
    const wasOk = prev?.tds_ppm != null && prev.tds_ppm >= TDS_ALERT_THRESHOLD;
    const isOk = row.tds_ppm >= TDS_ALERT_THRESHOLD;
    if (wasOk && !isOk) {
      await notifySensorAlert({
        kind: "tds_low",
        plantId: row.plant_id,
        value: row.tds_ppm,
        threshold: TDS_ALERT_THRESHOLD,
        unit: "ppm",
      });
    } else if (!wasOk && isOk && prev?.tds_ppm != null) {
      await notifySensorAlert({
        kind: "tds_recovered",
        plantId: row.plant_id,
        value: row.tds_ppm,
        threshold: TDS_ALERT_THRESHOLD,
        unit: "ppm",
      });
    }
  }

  // 水位警報: 前回が正常 → 今回下回った
  if (row.water_level_cm != null) {
    const prevLevel = prev?.water_level_cm;
    const wasAbove =
      prevLevel != null && prevLevel >= WATER_LEVEL_ALERT_THRESHOLD;
    const isBelow = row.water_level_cm < WATER_LEVEL_ALERT_THRESHOLD;
    if (wasAbove && isBelow) {
      await notifySensorAlert({
        kind: "water_low",
        plantId: row.plant_id,
        value: row.water_level_cm,
        threshold: WATER_LEVEL_ALERT_THRESHOLD,
        unit: "cm",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
