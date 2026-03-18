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
          <CartesianGrid stroke="rgba(65,105,67,0.18)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--color-text-secondary)"
            tickLine={false}
            axisLine={false}
            style={{ fontSize: 12 }}
          />
          <YAxis
            domain={[0, 10]}
            stroke="var(--color-text-secondary)"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(255,255,255,0.98)",
              border: "1px solid rgba(65,105,67,0.14)",
              borderRadius: 18,
              color: "var(--color-text-primary)",
              boxShadow: "var(--shadow-secondary)",
            }}
            labelStyle={{ color: "var(--color-text-secondary)" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--color-primary)"
            strokeWidth={3}
            dot={{ fill: "var(--color-accent)", stroke: "var(--color-primary-dark)", strokeWidth: 1, r: 4 }}
            activeDot={{ r: 6, fill: "var(--color-accent)", stroke: "var(--color-primary-dark)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
