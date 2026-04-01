"use client";

import React from "react";
import Link from "next/link";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { startTransition, useMemo, useState } from "react";
import { Pin, X } from "lucide-react";

import { MetricPicker } from "@/components/metric-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatMetricValue } from "@/lib/metrics/format";
import type { MetricDefinition, RankingRow } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";

type RankingsTableProps = {
  metrics: MetricDefinition[];
  initialMetric: MetricDefinition;
  initialRows: RankingRow[];
};

export function RankingsTable({ metrics, initialMetric, initialRows }: RankingsTableProps) {
  const [metric, setMetric] = useState(initialMetric);
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MetricDefinition["category"] | "All">("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [compare, setCompare] = useState<string[]>([]);

  const filteredMetrics = useMemo(
    () => metrics.filter((item) => category === "All" || item.category === category),
    [category, metrics]
  );

  const visibleRows = useMemo(
    () => rows.filter((row) => row.jurisdiction.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  const hasRows = rows.length > 0;
  const compareRows = useMemo(
    () =>
      compare
        .map((slug) => rows.find((row) => row.jurisdiction.slug === slug))
        .filter((row): row is RankingRow => Boolean(row)),
    [compare, rows]
  );

  const columns = useMemo<ColumnDef<RankingRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "Rank"
      },
      {
        accessorKey: "jurisdiction.name",
        header: "State",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              aria-label={`Pin ${row.original.jurisdiction.name}`}
              aria-pressed={compare.includes(row.original.jurisdiction.slug)}
              className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              onClick={() => toggleCompare(row.original.jurisdiction.slug)}
            >
              <Pin className="h-4 w-4" />
            </button>
            <Link className="font-semibold underline decoration-border underline-offset-4" href={`/states/${row.original.jurisdiction.slug}`}>
              {row.original.jurisdiction.name}
            </Link>
          </div>
        )
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ row }) => formatMetricValue(metric, row.original.value)
      },
      {
        accessorKey: "periodLabel",
        header: "Period"
      }
    ],
    [compare, metric]
  );

  const table = useReactTable({
    data: visibleRows,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  async function handleMetricChange(metricId: string) {
    const metricDefinition = metrics.find((entry) => entry.id === metricId);

    if (!metricDefinition) {
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
      });
    } catch {
      return;
    }
  }

  function handleCategoryChange(nextCategory: MetricDefinition["category"] | "All") {
    setCategory(nextCategory);

    const nextMetrics = metrics.filter(
      (item) => nextCategory === "All" || item.category === nextCategory
    );

    if (!nextMetrics.some((item) => item.id === metric.id) && nextMetrics[0]) {
      void handleMetricChange(nextMetrics[0].id);
    }
  }

  function toggleCompare(slug: string) {
    setCompare((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, slug];
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge>Rankings</Badge>
            <CardTitle className="text-3xl">Compare every state on one metric at a time.</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Raw values lead. Ranks and map shading are there to help people scan, not to hide the underlying metric.
            </CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
              Category
              <select
                className="h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-foreground"
                value={category}
                onChange={(event) => handleCategoryChange(event.target.value as typeof category)}
              >
                <option>All</option>
                <option>Economy</option>
                <option>Growth</option>
                <option>People &amp; Affordability</option>
              </select>
            </label>
            <MetricPicker metrics={filteredMetrics} value={metric.id} onChange={handleMetricChange} />
            <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
              Search
              <input
                className="h-11 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-foreground"
                placeholder="Search a state"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-muted/60 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Period</div>
            <div className="mt-2 font-semibold">{rows[0]?.periodLabel ?? "Waiting for ingest"}</div>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Release date</div>
            <div className="mt-2 font-semibold">{formatDateLabel(rows[0]?.releaseDate)}</div>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Direction</div>
            <div className="mt-2 font-semibold">
              {metric.betterDirection === "HIGHER" ? "Higher is better" : "Lower is better"}
            </div>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Coverage</div>
            <div className="mt-2 font-semibold">{hasRows ? `${rows.length} jurisdictions` : "No data yet"}</div>
          </div>
        </div>
        {!hasRows ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            This metric has no observations loaded yet. The ranking table stays available so you can switch metrics without losing your place.
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {compare.map((slug) => {
            const item = rows.find((row) => row.jurisdiction.slug === slug);

            if (!item) {
              return null;
            }

            return (
              <span key={slug} className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                {item.jurisdiction.name}
                <button aria-label={`Remove ${item.jurisdiction.name}`} onClick={() => toggleCompare(slug)}>
                  <X className="h-4 w-4" />
                </button>
              </span>
            );
          })}
        </div>
        <div className="space-y-3 rounded-3xl border border-border/70 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Pinned comparison</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Pin up to four states to compare their current standing on {metric.label.toLowerCase()}.
              </div>
            </div>
            <Badge>{compareRows.length}/4 pinned</Badge>
          </div>
          {compareRows.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {compareRows.map((row) => (
                <div key={row.jurisdiction.slug} className="rounded-2xl bg-muted/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{row.jurisdiction.name}</div>
                      <div className="text-sm text-muted-foreground">{row.periodLabel}</div>
                    </div>
                    <button
                      aria-label={`Remove ${row.jurisdiction.name}`}
                      className="rounded-full border border-border bg-white p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      onClick={() => toggleCompare(row.jurisdiction.slug)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rank</div>
                      <div className="mt-1 text-2xl font-bold">{row.rank}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Value</div>
                      <div className="mt-1 text-lg font-semibold">{formatMetricValue(metric, row.value)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
              No states pinned yet. Use the pin button in the table to build a side-by-side comparison.
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className="inline-flex items-center gap-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr className="border-t border-border/60">
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No state rows are available for this metric yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
