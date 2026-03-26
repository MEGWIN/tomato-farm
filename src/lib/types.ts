/** microCMS互換の栽培日記エントリ */
export type DiaryPost = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  slug: string;
  body: string; // HTML content
  excerpt: string;
  coverImage: CMSImage | null;
  day: number; // 栽培日数
  category: DiaryCategory[];
  claudeAnalysis: string | null; // Chloe先生の分析 (HTML)
  claudeAdvice: string | null; // Chloe先生のアドバイス
  sensorData: SensorSnapshot | null;
};

export type CMSImage = {
  url: string;
  height: number;
  width: number;
};

export type DiaryCategory =
  | "daily"
  | "experiment"
  | "trouble"
  | "harvest"
  | "setup";

export const CATEGORY_LABELS: Record<DiaryCategory, string> = {
  daily: "日常の記録",
  experiment: "実験・比較",
  trouble: "トラブル対応",
  harvest: "収穫",
  setup: "設備・準備",
};

export const CATEGORY_COLORS: Record<DiaryCategory, string> = {
  daily: "bg-sunshine-400 text-soil-900",
  experiment: "bg-leaf-500 text-white",
  trouble: "bg-tomato-500 text-white",
  harvest: "bg-tomato-400 text-white",
  setup: "bg-soil-200 text-soil-800",
};

export type SensorSnapshot = {
  temperature: number | null;
  humidity: number | null;
  waterTemp: number | null;
  ph: number | null;
  ec: number | null;
  recordedAt: string;
};

/** microCMSリスト形式 */
export type DiaryListResponse = {
  contents: DiaryPost[];
  totalCount: number;
  offset: number;
  limit: number;
};
