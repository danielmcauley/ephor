"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";

import { ChoroplethMap } from "@/components/choropleth-map";
import { MetricPicker } from "@/components/metric-picker";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatMetricValue } from "@/lib/metrics/format";
import type { MetricDefinition, RankingRow } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";

type OverviewClientProps = {
  metrics: MetricDefinition[];
  initialMetric: MetricDefinition;
  initialRows: RankingRow[];
};

export function OverviewClient({
  metrics,
  initialMetric,
  initialRows
}: OverviewClientProps) {
  const [metric, setMetric] = useState(initialMetric);
  const [rows, setRows] = useState(initialRows);
  const [isLoading, setIsLoading] = useState(false);
  const hasRows = rows.length > 0;

  const topFive = useMemo(() => rows.slice(0, 5), [rows]);
  const bottomFive = useMemo(() => rows.slice(-5).reverse(), [rows]);
  const bestRow = topFive[0] ?? null;
  const worstRow = bottomFive[0] ?? null;

  async function handleMetricChange(metricId: string) {
    setIsLoading(true);
    const metricDefinition = metrics.find((entry) => entry.id === metricId);

    if (!metricDefinition) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/rankings?metric=${metricId}`);

      if (!response.ok) {
        throw new Error(`Unable to load ${metricId}`);
      }

      const payload = (await response.json()) as {
        metric: MetricDefinition;
        rows: RankingRow[];
      };

      startTransition(() => {
        setMetric(metricDefinition);
        setRows(payload.rows);
        setIsLoading(false);
      });
    } catch {
      startTransition(() => {
        setIsLoading(false);
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="space-y-6 overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <Badge>Overview</Badge>
              <CardTitle className="text-3xl">Track the latest leaders and laggards by official state metric.</CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Every leaderboard uses one clearly named metric, one federal source, and one release period. No composite score.
              </CardDescription>
            </div>
            <MetricPicker metrics={metrics} value={metric.id} onChange={handleMetricChange} />
          </div>
          <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <ChoroplethMap rows={rows} />
          </div>
          {!hasRows ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              This metric is in the catalog, but there are no observations loaded yet. The source link and methodology are still available while the next ingest fills it in.
            </div>
          ) : null}
        </Card>
        <Card className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{metric.category}</Badge>
              <Badge className={hasRows ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}>
                {hasRows ? "Live ranking" : "Awaiting data"}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{metric.label}</CardTitle>
            <CardDescription>{metric.description}</CardDescription>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-muted p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest period</div>
                <div className="mt-2 text-lg font-semibold">{rows[0]?.periodLabel ?? "Waiting for ingest"}</div>
              </div>
              <div className="rounded-3xl bg-muted p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Release date</div>
                <div className="mt-2 text-lg font-semibold">{formatDateLabel(rows[0]?.releaseDate)}</div>
              </div>
              <div className="rounded-3xl bg-muted p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Direction</div>
                <div className="mt-2 text-lg font-semibold">
                  {metric.betterDirection === "HIGHER" ? "Higher is better" : "Lower is better"}
                </div>
              </div>
              <div className="rounded-3xl bg-muted p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Coverage</div>
                <div className="mt-2 text-lg font-semibold">
                  {hasRows ? `${rows.length} jurisdictions` : "0 jurisdictions"}
                </div>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-3xl border border-border/70 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current leader</div>
                <div className="mt-2 font-semibold">
                  {bestRow
                    ? `${bestRow.jurisdiction.name} · ${formatMetricValue(metric, bestRow.value)}`
                    : "No published observations yet"}
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current laggard</div>
                <div className="mt-2 font-semibold">
                  {worstRow
                    ? `${worstRow.jurisdiction.name} · ${formatMetricValue(metric, worstRow.value)}`
                    : "Ranking will appear after ingest"}
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-muted p-4">
              <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Source</div>
              <a className="mt-1 block text-sm font-semibold underline decoration-border underline-offset-4" href={metric.sourceUrl} target="_blank" rel="noreferrer">
                {metric.sourceName}
              </a>
            </div>
          </div>
          <Link href="/methodology" className={buttonVariants()}>
            See methodology
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Top 5</div>
            <CardTitle className="mt-2">Best current performers</CardTitle>
          </div>
          {topFive.length > 0 ? (
            <div className="space-y-3">
              {topFive.map((row) => (
                <div key={row.jurisdiction.slug} className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {row.rank}
                    </span>
                    <div>
                      <div className="font-semibold">{row.jurisdiction.name}</div>
                      <div className="text-sm text-muted-foreground">{row.periodLabel}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatMetricValue(metric, row.value)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
              No ranked states yet for this metric.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Bottom 5</div>
            <CardTitle className="mt-2">Worst performers</CardTitle>
          </div>
          {bottomFive.length > 0 ? (
            <div className="space-y-3">
              {bottomFive.map((row) => (
                <div key={row.jurisdiction.slug} className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                      {row.rank}
                    </span>
                    <div>
                      <div className="font-semibold">{row.jurisdiction.name}</div>
                      <div className="text-sm text-muted-foreground">{row.periodLabel}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatMetricValue(metric, row.value)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
              Worst performers will appear after the first successful refresh.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
