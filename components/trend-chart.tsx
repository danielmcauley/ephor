"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MetricDefinition } from "@/lib/types";
import { formatMetricValue } from "@/lib/metrics/format";

type TrendChartProps = {
  metric: MetricDefinition;
  data: Array<{ periodLabel: string; value: number }>;
};

export function TrendChart({ metric, data }: TrendChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(value: number) => formatMetricValue(metric, value)}
          />
          <Tooltip
            formatter={(value: number) => formatMetricValue(metric, value)}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #d3dfde",
              boxShadow: "0 12px 40px rgba(15, 30, 37, 0.12)"
            }}
          />
          <Line type="monotone" dataKey="value" stroke="#0f8b8d" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
