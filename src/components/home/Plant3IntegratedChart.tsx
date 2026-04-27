"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export interface IntegratedPoint {
  time: string;
  timestamp: number;
  water_temp: number | null;
  tds_ppm: number | null;
}

interface Props {
  data: IntegratedPoint[];
}

export default function Plant3IntegratedChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-soil-800/40">
        <p>まだセンサーデータがないぜ...30分ごとに更新されるぞ！</p>
      </div>
    );
  }

  return (
    <div className="h-72 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3E8E8" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "#6B5B4F" }}
            tickLine={false}
            axisLine={{ stroke: "#E8D5D5" }}
          />
          <YAxis
            yAxisId="temp"
            tick={{ fontSize: 11, fill: "#3B82F6" }}
            tickLine={false}
            axisLine={{ stroke: "#E8D5D5" }}
          />
          <YAxis
            yAxisId="ppm"
            orientation="right"
            tick={{ fontSize: 11, fill: "#10B981" }}
            tickLine={false}
            axisLine={{ stroke: "#E8D5D5" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #FECACA",
              fontSize: "13px",
            }}
            formatter={(value, name) => {
              const n = Number(value);
              if (name === "水温") return [`${n}°C`, name];
              if (name === "水質") return [`${n} ppm`, name];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: "13px" }} />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="water_temp"
            name="水温"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ fill: "#3B82F6", r: 3 }}
            connectNulls
          />
          <Line
            yAxisId="ppm"
            type="monotone"
            dataKey="tds_ppm"
            name="水質"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ fill: "#10B981", r: 3 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
