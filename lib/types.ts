import type { BetterDirection, MetricCadence, MetricCategory } from "@/lib/metrics/catalog";

export type MetricDefinition = {
  id: string;
  label: string;
  category: MetricCategory;
  sourceName: string;
  sourceUrl: string;
  cadence: MetricCadence;
  betterDirection: BetterDirection;
  unit: "percent" | "index" | "currency" | "currency_precise" | "count" | "rate";
  description: string;
  caveats?: string | null;
  methodology: string;
  defaultMetric?: boolean;
};

export type MetricObservation = {
  jurisdiction: {
    slug: string;
    name: string;
    abbr: string;
    fips: string;
  };
  metricId: string;
  periodKey: string;
  periodLabel: string;
  periodStart: string;
  periodEnd?: string | null;
  value: number;
  benchmarkValue?: number | null;
  benchmarkLabel?: string | null;
  releaseDate?: string | null;
  sourceUrl: string;
  ingestedAt: string;
};

export type RankingRow = {
  rank: number;
  tied: boolean;
  jurisdiction: MetricObservation["jurisdiction"];
  value: number;
  benchmarkValue?: number | null;
  percentile: number;
  deltaFromBenchmark?: number | null;
  periodLabel: string;
  releaseDate?: string | null;
  sourceUrl: string;
};

export type StateProfileMetric = {
  definition: MetricDefinition;
  latest: RankingRow | null;
  trend: Array<{
    periodLabel: string;
    value: number;
  }>;
};

export type StateProfile = {
  jurisdiction: MetricObservation["jurisdiction"];
  metrics: StateProfileMetric[];
};

export type RefreshStatus = {
  metricId: string;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";
  startedAt: string;
  completedAt?: string | null;
  releaseDate?: string | null;
  rowCount: number;
  message?: string | null;
  stale: boolean;
};
