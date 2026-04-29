import { getCultivationStats } from "@/lib/cultivation";
import {
  getWeeklyForecast,
  getHourlyForecast,
  getWeatherEmoji,
  evaluateTomatoRisk,
  evaluateBasilRisk,
  type PlantRisk,
} from "@/lib/weather";
import {
  aggregateHourlyAverage,
  getLatestWaterSensor,
  getWaterSensorHistory,
  waterLevelPercent,
} from "@/lib/water-sensor";
import GrowthChart from "./GrowthChart";
import Plant3IntegratedChart, {
  type IntegratedPoint,
} from "./Plant3IntegratedChart";

const PLANTS = [
  { id: 1, name: "プチトマト１", emoji: "🍅", color: "#EF4444" },
  { id: 2, name: "プチトマト２", emoji: "🍅", color: "#F97316" },
  { id: 3, name: "プチトマト３", emoji: "🍅", color: "#EAB308" },
] as const;

const CULTIVATION_START = "2026-03-10"; // 1日目

/** 栽培開始日からの経過日数（開始日=1日目） */
function daysSinceStart(dateStr: string): number {
  const start = new Date(CULTIVATION_START + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  const diffMs = target.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export default async function CultivationDashboard() {
  let stats = { plants: [], allLogs: [], harvestTotals: {}, harvestToday: {} } as Awaited<
    ReturnType<typeof getCultivationStats>
  >;
  let weekly: Awaited<ReturnType<typeof getWeeklyForecast>> = [];
  let hourly: Awaited<ReturnType<typeof getHourlyForecast>> = [];
  let plant3Latest: Awaited<ReturnType<typeof getLatestWaterSensor>> = null;
  let plant3History: Awaited<ReturnType<typeof getWaterSensorHistory>> = [];

  try {
    [stats, weekly, hourly, plant3Latest, plant3History] = await Promise.all([
      getCultivationStats(),
      getWeeklyForecast(),
      getHourlyForecast(),
      getLatestWaterSensor(3),
      getWaterSensorHistory(3, 24),
    ]);
  } catch (e) {
    console.error("Dashboard data fetch failed:", e);
  }

  // 3号の水センサー最新値をカードに表示用整形
  const plant3WaterTemp =
    plant3Latest?.water_temp != null ? `${plant3Latest.water_temp}°C` : "準備中";

  // TDS警報: 1400ppm未満で警告（肥料薄すぎ）、1400ppm以上は正常範囲
  const plant3TdsAlert =
    plant3Latest?.tds_ppm != null && plant3Latest.tds_ppm < 1400;
  const plant3TdsLabel =
    plant3Latest?.tds_ppm == null
      ? "準備中"
      : plant3TdsAlert
        ? `⚠ ${plant3Latest.tds_ppm}ppm`
        : `✓ ${plant3Latest.tds_ppm}ppm`;

  const plant3LevelPct = waterLevelPercent(plant3Latest?.water_level_cm ?? null);
  const plant3LevelLabel =
    plant3Latest?.water_level_cm != null
      ? `${plant3Latest.water_level_cm}cm`
      : "準備中";

  // 総合グラフ用データ（24時間分、水温・水質ppm）— JST 1時間バケット平均、TDS<600ppm は外れ値として除外
  const integratedChartData: IntegratedPoint[] = aggregateHourlyAverage(
    plant3History,
  ).map((b) => {
    const jst = new Date(b.hourMs + 9 * 60 * 60 * 1000);
    const h = String(jst.getUTCHours()).padStart(2, "0");
    return {
      time: `${h}:00`,
      timestamp: b.hourMs,
      water_temp: b.water_temp,
      tds_ppm: b.tds_ppm,
    };
  });

  // 株ごとのデータをID順に取り出す
  const plantStatsById = new Map(stats.plants.map((p) => [p.plantId, p]));

  // グラフ用データ: 日付ごとに各株の草丈をまとめる
  const dateSet = new Set(stats.allLogs.map((l) => l.date));
  const sortedDates = [...dateSet].sort();
  const chartData = sortedDates.map((date) => {
    const row: { label: string; date: string; [key: string]: number | string | null } = {
      date,
      label: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
    };
    for (const p of PLANTS) {
      const log = stats.allLogs.find(
        (l) => l.date === date && l.plant_id === p.id
      );
      row[`plant${p.id}`] = log?.height_cm ?? null;
    }
    return row;
  });

  // 曜日名
  const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

  // 危険度バッジのスタイル
  const RISK_STYLE: Record<PlantRisk["level"], string> = {
    safe: "bg-leaf-100 text-leaf-700",
    caution: "bg-sunshine-100 text-sunshine-700",
    danger: "bg-tomato-100 text-tomato-700",
  };
  const RISK_DOT: Record<PlantRisk["level"], string> = {
    safe: "🟢",
    caution: "🟡",
    danger: "🔴",
  };

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-soil-50 to-leaf-50/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* セクションヘッダー */}
        <div className="text-center">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-soil-900 mb-2">
            栽培ダッシュボード
          </h2>
          <p className="text-soil-800/60 text-sm">リアルタイムの栽培状況</p>
        </div>

        {/* 個体別カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANTS.map((plant) => {
            const ps = plantStatsById.get(plant.id);
            const latest = ps?.latestLog ?? null;
            const previous = ps?.previousLog ?? null;
            const diff =
              latest?.height_cm != null && previous?.height_cm != null
                ? latest.height_cm - previous.height_cm
                : null;
            return (
              <div
                key={plant.id}
                className="bg-white rounded-2xl p-5 border border-tomato-100/50 shadow-sm"
              >
                <div
                  className="flex items-center gap-2 mb-4 pb-3 border-b-2"
                  style={{ borderColor: plant.color }}
                >
                  <span className="text-3xl">{plant.emoji}</span>
                  <h3 className="font-heading font-bold text-lg text-soil-900">
                    {plant.name}
                  </h3>
                </div>

                {/* 基本データ（2行×3列） */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {/* 1行目 */}
                  <div className="text-center">
                    <p className="text-xs font-bold text-soil-800/50 mb-1">栽培日数</p>
                    <p className="font-heading font-black text-xl text-leaf-600">
                      {latest ? `${daysSinceStart(latest.date)}日目` : "--"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-soil-800/50 mb-1">前日比</p>
                    <p className="font-heading font-black text-xl text-sunshine-500">
                      {diff != null ? `${diff >= 0 ? "+" : ""}${diff}cm` : "--"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-soil-800/50 mb-1">🍅 当日収穫</p>
                    <p className="font-heading font-black text-xl text-tomato-500">
                      {(stats.harvestToday[plant.id] ?? 0)}個
                    </p>
                  </div>
                  {/* 2行目 */}
                  <div />
                  <div className="text-center">
                    <p className="text-xs font-bold text-soil-800/50 mb-1">草丈</p>
                    <p className="font-heading font-black text-xl text-leaf-600">
                      {latest?.height_cm != null ? `${latest.height_cm}cm` : "--"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-soil-800/50 mb-1">🍅 累計収穫</p>
                    <p className="font-heading font-black text-xl text-tomato-500">
                      {(stats.harvestTotals[plant.id] ?? 0)}個
                    </p>
                  </div>
                </div>

                {/* センサーデータ（3号のみ実データ、1・2号は準備中） */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-dashed border-soil-200">
                  <div className="text-center">
                    <p className="text-xs font-bold text-soil-800/50 mb-1">💧 水温</p>
                    <p
                      className={`font-heading font-bold text-sm ${
                        plant.id === 3 && plant3Latest?.water_temp != null
                          ? "text-blue-500"
                          : "text-soil-400"
                      }`}
                    >
                      {plant.id === 3 ? plant3WaterTemp : "準備中"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-soil-800/50 mb-1">🧪 水質</p>
                    <p
                      className={`font-heading font-bold text-sm ${
                        plant.id === 3 && plant3Latest?.tds_ppm != null
                          ? plant3TdsAlert
                            ? "text-tomato-500"
                            : "text-emerald-500"
                          : "text-soil-400"
                      }`}
                    >
                      {plant.id === 3 ? plant3TdsLabel : "準備中"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-soil-800/50 mb-1">📏 水位</p>
                    <p
                      className={`font-heading font-bold text-sm ${
                        plant.id === 3 && plant3Latest?.water_level_cm != null
                          ? "text-purple-500"
                          : "text-soil-400"
                      }`}
                    >
                      {plant.id === 3
                        ? plant3LevelPct != null
                          ? `${plant3LevelLabel} (${plant3LevelPct}%)`
                          : plant3LevelLabel
                        : "準備中"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 成長グラフ */}
        <div className="bg-white rounded-2xl shadow-sm border border-leaf-200/50 p-6">
          <h3 className="font-heading font-bold text-lg text-soil-900 mb-4 flex items-center gap-2">
            <span className="text-tomato-500">📈</span> 成長グラフ
          </h3>
          <GrowthChart
            data={chartData}
            series={PLANTS.map((p) => ({
              key: `plant${p.id}`,
              name: p.name,
              color: p.color,
            }))}
          />
        </div>

        {/* 🍅3号 総合グラフ（直近24時間） */}
        <div className="bg-white rounded-2xl shadow-sm border border-leaf-200/50 p-6">
          <h3 className="font-heading font-bold text-lg text-soil-900 mb-1 flex items-center gap-2">
            <span className="text-tomato-500">🍅</span> プチトマト３ 総合グラフ
          </h3>
          <p className="text-xs text-soil-800/50 mb-4">
            直近24時間・1時間ごと(平均値) / 水温(°C)・水質(ppm)
          </p>
          <Plant3IntegratedChart data={integratedChartData} />
        </div>

        {/* 3時間ごとの予報 */}
        {hourly.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-leaf-200/50 p-6">
            <h3 className="font-heading font-bold text-lg text-soil-900 mb-4 flex items-center gap-2">
              <span className="text-leaf-500">⏰</span> 3時間ごとの予報
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {hourly.map((h) => {
                const tomatoRisk = evaluateTomatoRisk({
                  tempMin: h.temperature,
                  tempMax: h.temperature,
                });
                const basilRisk = evaluateBasilRisk({
                  tempMin: h.temperature,
                  tempMax: h.temperature,
                });
                return (
                  <div
                    key={h.time}
                    className="text-center p-3 rounded-xl bg-soil-50"
                  >
                    <p className="text-xs font-bold text-soil-800/60 mb-1">
                      {new Date(h.time).getHours()}:00
                    </p>
                    <span className="text-2xl block mb-1">{h.weatherEmoji}</span>
                    <p className="font-heading font-bold text-sm text-soil-900">
                      {h.temperature}°
                    </p>
                    <div className="mt-2 space-y-1">
                      <div
                        className={`text-[10px] rounded-full px-1 py-0.5 ${RISK_STYLE[tomatoRisk.level]}`}
                        title={`プチトマト: ${tomatoRisk.reason}`}
                      >
                        🍅 {RISK_DOT[tomatoRisk.level]}
                      </div>
                      <div
                        className={`text-[10px] rounded-full px-1 py-0.5 ${RISK_STYLE[basilRisk.level]}`}
                        title={`バジル: ${basilRisk.reason}`}
                      >
                        🌿 {RISK_DOT[basilRisk.level]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-soil-800/50 mt-3 text-center">
              🟢 安全 / 🟡 注意 / 🔴 危険（ホバーで理由表示）
            </p>
          </div>
        )}

        {/* 週間天気予報 */}
        {weekly.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-leaf-200/50 p-6">
            <h3 className="font-heading font-bold text-lg text-soil-900 mb-4 flex items-center gap-2">
              <span className="text-leaf-500">🌤️</span> 今週の天気（八王子）
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {weekly.map((day) => {
                const d = new Date(day.date + "T00:00:00");
                const dayName = DAY_NAMES[d.getDay()];
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const tomatoRisk = evaluateTomatoRisk({
                  tempMin: day.tempMin,
                  tempMax: day.tempMax,
                  precipitation: day.precipitationSum,
                });
                const basilRisk = evaluateBasilRisk({
                  tempMin: day.tempMin,
                  tempMax: day.tempMax,
                  precipitation: day.precipitationSum,
                });
                return (
                  <div
                    key={day.date}
                    className="text-center p-3 rounded-xl bg-soil-50"
                  >
                    <p
                      className={`text-xs font-bold mb-1 ${
                        isWeekend ? "text-tomato-500" : "text-soil-800/60"
                      }`}
                    >
                      {dayName}
                    </p>
                    <span className="text-2xl block mb-1">
                      {getWeatherEmoji(day.weatherCode)}
                    </span>
                    <p className="font-heading font-bold text-sm text-soil-900">
                      {Math.round(day.tempMax)}°
                    </p>
                    <p className="text-xs text-soil-800/40">
                      {Math.round(day.tempMin)}°
                    </p>
                    {day.precipitationSum > 0 && (
                      <p className="text-xs text-blue-500 mt-0.5">
                        {day.precipitationSum}mm
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      <div
                        className={`text-[10px] rounded-full px-1 py-0.5 ${RISK_STYLE[tomatoRisk.level]}`}
                        title={`プチトマト: ${tomatoRisk.reason}`}
                      >
                        🍅 {RISK_DOT[tomatoRisk.level]}
                      </div>
                      <div
                        className={`text-[10px] rounded-full px-1 py-0.5 ${RISK_STYLE[basilRisk.level]}`}
                        title={`バジル: ${basilRisk.reason}`}
                      >
                        🌿 {RISK_DOT[basilRisk.level]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-soil-800/50 mt-3 text-center">
              🟢 安全 / 🟡 注意 / 🔴 危険（ホバーで理由表示）
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
