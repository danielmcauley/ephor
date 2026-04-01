"use client";

import { useId } from "react";

import type { MetricDefinition } from "@/lib/types";

type MetricPickerProps = {
  label?: string;
  metrics: MetricDefinition[];
  value: string;
  onChange: (value: string) => void;
};

export function MetricPicker({ label = "Metric", metrics, value, onChange }: MetricPickerProps) {
  const id = useId();
  const hasMetrics = metrics.length > 0;

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground" htmlFor={id}>
      {label}
      <select
        id={id}
        className="h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none ring-0"
        value={hasMetrics ? value : ""}
        disabled={!hasMetrics}
        onChange={(event) => onChange(event.target.value)}
      >
        {hasMetrics ? (
          metrics.map((metric) => (
            <option key={metric.id} value={metric.id}>
              {metric.label}
            </option>
          ))
        ) : (
          <option value="">No metrics available</option>
        )}
      </select>
    </label>
  );
}
