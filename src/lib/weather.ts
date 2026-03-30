/**
 * 八王子の天気データを取得するユーティリティ
 * Open-Meteo API（無料・APIキー不要）を使用
 * 日記の記録やChloe先生の分析で利用する
 */

// 八王子市の座標
const HACHIOJI_LAT = 35.6664;
const HACHIOJI_LON = 139.3160;

export interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
  weatherEmoji: string;
  windSpeed: number;
  precipitation: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
  weatherEmoji: string;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  weatherDescription: string;
  precipitationSum: number;
}

// WMO Weather interpretation codes → 日本語
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

function getWeatherDescription(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "不明";
}

// WMO Weather code → 絵文字
const WEATHER_EMOJI: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌦️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "🌨️",
  80: "🌦️",
  81: "🌦️",
  82: "🌦️",
  85: "🌨️",
  86: "🌨️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

export function getWeatherEmoji(code: number): string {
  return WEATHER_EMOJI[code] ?? "🌡️";
}

/**
 * 現在の天気を取得
 */
export async function getCurrentWeather(): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${HACHIOJI_LAT}&longitude=${HACHIOJI_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=Asia%2FTokyo`;

  const res = await fetch(url, { next: { revalidate: 1800 } }); // 30分キャッシュ
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  const current = data.current;

  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    weatherDescription: getWeatherDescription(current.weather_code),
    weatherEmoji: getWeatherEmoji(current.weather_code),
    windSpeed: current.wind_speed_10m,
    precipitation: current.precipitation,
  };
}

/**
 * 3時間ごとの予報を取得（今から24時間分、最大8件）
 */
export async function getHourlyForecast(): Promise<HourlyForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${HACHIOJI_LAT}&longitude=${HACHIOJI_LON}&hourly=temperature_2m,weather_code&timezone=Asia%2FTokyo&forecast_days=2`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  const hourly = data.hourly;
  const now = new Date();

  const entries: HourlyForecast[] = [];
  for (let i = 0; i < hourly.time.length && entries.length < 8; i++) {
    const entryTime = new Date(hourly.time[i]);
    if (entryTime <= now) continue;
    if (entryTime.getHours() % 3 !== 0) continue;

    entries.push({
      time: hourly.time[i],
      temperature: Math.round(hourly.temperature_2m[i]),
      weatherCode: hourly.weather_code[i],
      weatherDescription: getWeatherDescription(hourly.weather_code[i]),
      weatherEmoji: getWeatherEmoji(hourly.weather_code[i]),
    });
  }

  return entries;
}

/**
 * 週間予報を取得（7日間）
 */
export async function getWeeklyForecast(): Promise<DailyForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${HACHIOJI_LAT}&longitude=${HACHIOJI_LON}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=Asia%2FTokyo`;

  const res = await fetch(url, { next: { revalidate: 3600 } }); // 1時間キャッシュ
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  const daily = data.daily;

  return daily.time.map((date: string, i: number) => ({
    date,
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    weatherCode: daily.weather_code[i],
    weatherDescription: getWeatherDescription(daily.weather_code[i]),
    precipitationSum: daily.precipitation_sum[i],
  }));
}
