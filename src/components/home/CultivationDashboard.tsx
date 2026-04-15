import { getCultivationStats } from "@/lib/cultivation";
import { getWeeklyForecast, getHourlyForecast, getWeatherEmoji } from "@/lib/weather";
import GrowthChart from "./GrowthChart";

export default async function CultivationDashboard() {
  let stats = { latestLog: null, previousLog: null, allLogs: [] } as Awaited<
    ReturnType<typeof getCultivationStats>
  >;
  let weekly: Awaited<ReturnType<typeof getWeeklyForecast>> = [];
  let hourly: Awaited<ReturnType<typeof getHourlyForecast>> = [];

  try {
    [stats, weekly, hourly] = await Promise.all([
      getCultivationStats(),
      getWeeklyForecast(),
      getHourlyForecast(),
    ]);
  } catch (e) {
    console.error("Dashboard data fetch failed:", e);
  }

  const { latestLog, previousLog, allLogs } = stats;

  // 成長差分を計算
  const heightDiff =
    latestLog?.height_cm != null && previousLog?.height_cm != null
      ? latestLog.height_cm - previousLog.height_cm
      : null;

  // グラフ用データ
  const chartData = allLogs.map((log) => ({
    date: log.date,
    label: `${new Date(log.date).getMonth() + 1}/${new Date(log.date).getDate()}`,
    height: log.height_cm,
    day: log.day_number,
  }));

  // 曜日名
  const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

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
          {[
            { name: "プチトマト１", emoji: "🍅" },
            { name: "プチトマト２", emoji: "🍅" },
            { name: "プチトマト３", emoji: "🍅" },
          ].map((plant) => (
            <div
              key={plant.name}
              className="bg-white rounded-2xl p-5 border border-tomato-100/50 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-leaf-100">
                <span className="text-3xl">{plant.emoji}</span>
                <h3 className="font-heading font-bold text-lg text-soil-900">
                  {plant.name}
                </h3>
              </div>

              {/* 基本データ */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-soil-800/50 mb-1">栽培日数</p>
                  <p className="font-heading font-black text-xl text-leaf-600">
                    {latestLog ? `${latestLog.day_number}日目` : "--"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-soil-800/50 mb-1">草丈</p>
                  <p className="font-heading font-black text-xl text-leaf-600">
                    {latestLog?.height_cm != null ? `${latestLog.height_cm}cm` : "--"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-soil-800/50 mb-1">前回比</p>
                  <p className="font-heading font-black text-xl text-sunshine-500">
                    {heightDiff != null ? `+${heightDiff}cm` : "--"}
                  </p>
                </div>
              </div>

              {/* センサーデータ（準備中） */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-dashed border-soil-200">
                <div className="text-center">
                  <p className="text-xs font-bold text-soil-800/50 mb-1">💧 水温</p>
                  <p className="font-heading font-bold text-sm text-soil-400">準備中</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-soil-800/50 mb-1">🧪 水質</p>
                  <p className="font-heading font-bold text-sm text-soil-400">準備中</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-soil-800/50 mb-1">📏 水位</p>
                  <p className="font-heading font-bold text-sm text-soil-400">準備中</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 成長グラフ */}
        <div className="bg-white rounded-2xl shadow-sm border border-leaf-200/50 p-6">
          <h3 className="font-heading font-bold text-lg text-soil-900 mb-4 flex items-center gap-2">
            <span className="text-tomato-500">📈</span> 成長グラフ
          </h3>
          <GrowthChart data={chartData} />
        </div>

        {/* 3時間ごとの予報 */}
        {hourly.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-leaf-200/50 p-6">
            <h3 className="font-heading font-bold text-lg text-soil-900 mb-4 flex items-center gap-2">
              <span className="text-leaf-500">⏰</span> 3時間ごとの予報
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {hourly.map((h) => (
                <div
                  key={h.time}
                  className="text-center p-3 rounded-xl bg-soil-50"
                >
                  <p className="text-xs font-bold text-soil-800/60 mb-1">
                    {new Date(h.time).getHours()}:00
                  </p>
                  <span className="text-2xl block mb-1">
                    {h.weatherEmoji}
                  </span>
                  <p className="font-heading font-bold text-sm text-soil-900">
                    {h.temperature}°
                  </p>
                </div>
              ))}
            </div>
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
