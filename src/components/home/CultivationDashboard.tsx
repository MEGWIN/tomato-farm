import { getCultivationStats } from "@/lib/cultivation";
import { getWeeklyForecast, getHourlyForecast, getCurrentWeather, getWeatherEmoji } from "@/lib/weather";
import GrowthChart from "./GrowthChart";

export default async function CultivationDashboard() {
  let stats = { latestLog: null, previousLog: null, allLogs: [] } as Awaited<
    ReturnType<typeof getCultivationStats>
  >;
  let weekly: Awaited<ReturnType<typeof getWeeklyForecast>> = [];
  let hourly: Awaited<ReturnType<typeof getHourlyForecast>> = [];
  let weather: Awaited<ReturnType<typeof getCurrentWeather>> | null = null;

  try {
    [stats, weekly, hourly, weather] = await Promise.all([
      getCultivationStats(),
      getWeeklyForecast(),
      getHourlyForecast(),
      getCurrentWeather(),
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

        {/* ステータスカード + 現在の天気 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-tomato-100/50 shadow-sm text-center">
            <p className="text-sm font-bold text-soil-800/50 mb-1">栽培日数</p>
            <p className="font-heading font-black text-3xl text-leaf-600">
              {latestLog ? (
                <><span className="text-2xl">🌱</span> {latestLog.day_number}日目</>
              ) : "--"}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-tomato-100/50 shadow-sm text-center">
            <p className="text-sm font-bold text-soil-800/50 mb-1">現在の草丈</p>
            <p className="font-heading font-black text-3xl text-leaf-600">
              {latestLog?.height_cm != null ? `${latestLog.height_cm}cm` : "--"}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-tomato-100/50 shadow-sm text-center">
            <p className="text-sm font-bold text-soil-800/50 mb-1">前回比</p>
            <p className="font-heading font-black text-3xl text-sunshine-500">
              {heightDiff != null ? `+${heightDiff}cm` : "--"}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-tomato-100/50 shadow-sm text-center">
            <p className="text-sm font-bold text-soil-800/50 mb-1">今の天気</p>
            {weather ? (
              <p className="font-heading font-black text-3xl">
                <span className="text-2xl">{weather.weatherEmoji}</span>{" "}
                <span className="text-soil-900">{Math.round(weather.temperature)}°</span>
              </p>
            ) : (
              <p className="font-heading font-black text-3xl text-soil-800/30">--</p>
            )}
          </div>
        </div>

        {/* 栽培メンバー */}
        <div className="bg-white rounded-2xl shadow-sm border border-leaf-200/50 p-6">
          <h3 className="font-heading font-bold text-lg text-soil-900 mb-4 flex items-center gap-2">
            <span className="text-leaf-500">🌱</span> 栽培メンバー
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "プチトマト１", emoji: "🍅" },
              { name: "プチトマト２", emoji: "🍅" },
              { name: "プチトマト３", emoji: "🍅" },
            ].map((plant) => (
              <div
                key={plant.name}
                className="text-center p-4 rounded-xl bg-soil-50 border border-leaf-100"
              >
                <span className="text-3xl block mb-2">{plant.emoji}</span>
                <p className="font-heading font-bold text-sm text-soil-900">
                  {plant.name}
                </p>
              </div>
            ))}
          </div>
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
