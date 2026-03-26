export default function SensorPlaceholder() {
  const sensors = [
    { icon: "🌡️", label: "気温", value: "--°C" },
    { icon: "💧", label: "湿度", value: "--%"  },
    { icon: "🌊", label: "水温", value: "--°C" },
    { icon: "⚗️", label: "pH値", value: "--" },
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-soil-50 to-leaf-50/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-soil-900 mb-3">
            <span className="text-leaf-500">📡</span> リアルタイムセンサーデータ
          </h2>
          <p className="text-soil-800/70">ESP32センサーからデータを自動取得</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-leaf-200/50 p-8">
          {/* Sensor Cards */}
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
    </section>
  );
}
