/**
 * 八王子の天気データを取得（Discord Bot用）
 * Open-Meteo API（無料・APIキー不要）
 */

const HACHIOJI_LAT = 35.6664;
const HACHIOJI_LON = 139.3160;

export interface WeatherData {
  temperature: number;
  humidity: number;
  weatherDescription: string;
  windSpeed: number;
  precipitation: number;
  tempMax: number;
  tempMin: number;
}

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "快晴",
  1: "晴れ",
  2: "一部曇り",
  3: "曇り",
  45: "霧",
  48: "霧氷",
  51: "小雨（霧雨）",
  53: "雨（霧雨）",
  55: "強い霧雨",
  61: "小雨",
  63: "雨",
  65: "大雨",
  71: "小雪",
  73: "雪",
  75: "大雪",
  80: "にわか雨（弱）",
  81: "にわか雨",
  82: "にわか雨（強）",
  85: "にわか雪（弱）",
  86: "にわか雪（強）",
  95: "雷雨",
  96: "雷雨（雹あり）",
  99: "雷雨（強い雹）",
};

export async function getCurrentWeather(): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${HACHIOJI_LAT}&longitude=${HACHIOJI_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  const current = data.current;
  const daily = data.daily;

  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    weatherDescription: WEATHER_DESCRIPTIONS[current.weather_code] ?? "不明",
    windSpeed: current.wind_speed_10m,
    precipitation: current.precipitation,
    tempMax: daily.temperature_2m_max[0],
    tempMin: daily.temperature_2m_min[0],
  };
}

/** 天気情報をプロンプト用テキストに変換 */
export function formatWeatherForPrompt(weather: WeatherData): string {
  return `天気: ${weather.weatherDescription} / 最高気温: ${weather.tempMax}℃ / 最低気温: ${weather.tempMin}℃ / 現在気温: ${weather.temperature}℃ / 湿度: ${weather.humidity}% / 風速: ${weather.windSpeed}km/h / 降水量: ${weather.precipitation}mm`;
}
