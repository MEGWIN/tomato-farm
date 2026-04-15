"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface Series {
  key: string;
  name: string;
  color: string;
}

interface GrowthChartProps {
  data: Array<{ label: string; date: string; [key: string]: number | string | null }>;
  series: Series[];
}

export default function GrowthChart({ data, series }: GrowthChartProps) {
  // 少なくとも1系列に値があるポイントだけ表示
  const chartData = data.filter((d) =>
    series.some((s) => d[s.key] != null)
  );

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
            formatter={(value, name) => [`${value}cm`, String(name)]}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #FECACA",
              fontSize: "14px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "13px" }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={3}
              dot={{ fill: s.color, r: 4, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: s.color }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
