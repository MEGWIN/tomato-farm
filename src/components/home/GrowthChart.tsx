"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  date: string;
  label: string;
  height: number | null;
  day: number;
}

interface GrowthChartProps {
  data: DataPoint[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
  // 草丈データがあるポイントだけ表示
  const chartData = data
    .filter((d) => d.height != null)
    .map((d) => ({
      label: d.label,
      height: d.height,
      day: d.day,
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-soil-800/40">
        <p>まだ草丈データがないぜ...記録が始まったらグラフが表示されるぞ！</p>
      </div>
    );
  }

  return (
    <div className="h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3E8E8" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6B5B4F" }}
            tickLine={false}
            axisLine={{ stroke: "#E8D5D5" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B5B4F" }}
            tickLine={false}
            axisLine={{ stroke: "#E8D5D5" }}
            unit="cm"
          />
          <Tooltip
            formatter={(value) => [`${value}cm`, "草丈"]}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #FECACA",
              fontSize: "14px",
            }}
          />
          <Line
            type="monotone"
            dataKey="height"
            stroke="#EF4444"
            strokeWidth={3}
            dot={{ fill: "#EF4444", r: 5, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 7, fill: "#DC2626" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
