import { getCurrentWeather, getHourlyForecast } from "@/lib/weather";

export default async function SensorPlaceholder() {
  let weather = null;
  let hourly: Awaited<ReturnType<typeof getHourlyForecast>> = [];

  try {
    [weather, hourly] = await Promise.all([
      getCurrentWeather(),
      getHourlyForecast(),
    ]);
  } catch (e) {
    console.error("Weather fetch failed:", e);
  }

  const sensors = [
    { icon: "🌡️", label: "気温", value: "--°C" },
    { icon: "💧", label: "湿度", value: "--%" },
    { icon: "🌊", label: "水温", value: "--°C" },
    { icon: "⚗️", label: "pH値", value: "--" },
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-soil-50 to-leaf-50/30">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ESP Sensor Section */}
        <div>
          <div className="text-center mb-6">
            <h2 className="font-heading font-black text-3xl md:text-4xl text-soil-900 mb-3">
              <span className="text-leaf-500">📡</span> リアルタイムセンサーデータ
            </h2>
            <p className="text-soil-800/70">ESP32センサーからデータを自動取得</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-leaf-200/50 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {sensors.map((sensor) => (
                <div
                  key={sensor.label}
                  className="bg-leaf-50 rounded-xl p-4 text-center"
                >
                  <span className="text-3xl block mb-2">{sensor.icon}</span>
                  <p className="text-sm font-bold text-soil-800/70 mb-1">
                    {sensor.label}
                  </p>
                  <p className="font-heading font-black text-2xl text-soil-800/30">
                    {sensor.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Coming Soon */}
            <div className="text-center py-4 bg-sunshine-100/50 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2 h-2 bg-sunshine-500 rounded-full animate-tomato-pulse" />
                <span className="font-heading font-bold text-sunshine-500 text-sm">
                  COMING SOON
                </span>
              </div>
              <p className="text-sm text-soil-800/60">
                Phase 2で公開予定！ESP32センサーから自動取得します
              </p>
            </div>
          </div>
        </div>

        {/* Weather Section */}
        {weather && (
          <div className="bg-white rounded-2xl shadow-md border border-leaf-200/50 p-8">
            <h3 className="font-heading font-bold text-xl text-soil-900 mb-5 flex items-center gap-2">
              {weather.weatherEmoji} 八王子の天気
            </h3>

            {/* Current Weather */}
            <div className="bg-leaf-50 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{weather.weatherEmoji}</span>
                <div>
                  <p className="font-heading font-black text-3xl text-soil-900">
                    {Math.round(weather.temperature)}°C
                  </p>
                  <p className="text-soil-800/70 text-sm">
                    {weather.weatherDescription} / 湿度 {weather.humidity}% /
                    風速 {weather.windSpeed}km/h
                    {weather.precipitation > 0 &&
                      ` / 降水量 ${weather.precipitation}mm`}
                  </p>
                </div>
              </div>
            </div>

            {/* 3-Hour Forecast */}
            {hourly.length > 0 && (
              <div>
                <h4 className="font-heading font-bold text-sm text-soil-800/60 mb-3">
                  3時間ごとの予報
                </h4>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {hourly.map((h) => (
                    <div
                      key={h.time}
                      className="text-center p-2 rounded-lg bg-soil-50"
                    >
                      <p className="text-xs text-soil-800/50 mb-1">
                        {new Date(h.time).getHours()}:00
                      </p>
                      <span className="text-2xl block mb-1">
                        {h.weatherEmoji}
                      </span>
                      <p className="font-heading font-bold text-sm text-soil-900">
                        {h.temperature}°C
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
