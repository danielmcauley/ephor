import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RankingsTable } from "@/components/rankings-table";
import type { MetricDefinition, RankingRow } from "@/lib/types";

const metrics: MetricDefinition[] = [
  {
    id: "payroll_growth",
    label: "Payroll job growth",
    category: "Economy",
    sourceName: "BLS",
    sourceUrl: "https://bls.gov",
    cadence: "MONTHLY",
    betterDirection: "HIGHER",
    unit: "percent",
    description: "desc",
    caveats: null,
    methodology: "method",
    defaultMetric: true
  }
];

const rows: RankingRow[] = [
  {
    rank: 1,
    tied: false,
    jurisdiction: { slug: "alabama", name: "Alabama", abbr: "AL", fips: "01" },
    value: 4.5,
    benchmarkValue: null,
    percentile: 100,
    deltaFromBenchmark: null,
    periodLabel: "Jan 2026",
    releaseDate: null,
    sourceUrl: "https://example.gov"
  },
  {
    rank: 2,
    tied: false,
    jurisdiction: { slug: "colorado", name: "Colorado", abbr: "CO", fips: "08" },
    value: 3.5,
    benchmarkValue: null,
    percentile: 70,
    deltaFromBenchmark: null,
    periodLabel: "Jan 2026",
    releaseDate: null,
    sourceUrl: "https://example.gov"
  }
];

describe("RankingsTable", () => {
  it("filters by search and lets users pin a state for comparison", () => {
    render(<RankingsTable metrics={metrics} initialMetric={metrics[0]} initialRows={rows} />);

    fireEvent.change(screen.getByPlaceholderText("Search a state"), {
      target: { value: "colo" }
    });

    expect(screen.queryByText("Alabama")).not.toBeInTheDocument();
    expect(screen.getByText("Colorado")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search a state"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByLabelText("Pin Alabama"));

    expect(screen.getByLabelText("Remove Alabama")).toBeInTheDocument();
  });

  it("keeps the rankings shell visible when a metric has no rows yet", () => {
    render(<RankingsTable metrics={metrics} initialMetric={metrics[0]} initialRows={[]} />);

    expect(screen.getAllByText("Compare every state on one metric at a time.")[0]).toBeInTheDocument();
    expect(screen.getByText("No state rows are available for this metric yet.")).toBeInTheDocument();
  });
});
