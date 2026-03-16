"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ScoreTrendChartProps = {
  data: Array<{
    interviewId: string;
    label: string;
    score: number;
  }>;
};

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, 10]}
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(9, 9, 11, 0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 18,
              color: "#f4f4f5",
            }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={{ fill: "#22d3ee", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "#34d399" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
