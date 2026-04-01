import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChoroplethMap } from "@/components/choropleth-map";
import type { RankingRow, StateStackupSummary } from "@/lib/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push
  })
}));

vi.mock("react-simple-maps", () => ({
  ComposableMap: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Geographies: ({
    children
  }: {
    children: (args: {
      geographies: Array<{ id: string | number; rsmKey: string }>;
    }) => React.ReactNode;
  }) =>
    children({
      geographies: [{ id: "06", rsmKey: "california" }]
    }),
  Geography: ({
    geography,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    onClick,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
  }: React.SVGProps<SVGPathElement> & {
    geography: { id: string | number; rsmKey: string };
  }) => (
    <path
      data-testid={`geography-${geography.id}`}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      {...props}
    />
  )
}));

const rows: RankingRow[] = [
  {
    rank: 5,
    tied: false,
    jurisdiction: {
      slug: "california",
      name: "California",
      abbr: "CA",
      fips: "06"
    },
    value: 1.1,
    benchmarkValue: null,
    deltaFromBenchmark: null,
    percentile: 90,
    periodLabel: "Dec 2025",
    releaseDate: null,
    sourceUrl: "https://example.gov"
  }
];

const stateSummaries: StateStackupSummary[] = [
  {
    jurisdiction: {
      slug: "california",
      name: "California",
      abbr: "CA",
      fips: "06"
    },
    best: [
      { metricId: "a", metricLabel: "Payroll job growth", rank: 2 },
      { metricId: "b", metricLabel: "Population growth", rank: 4 },
      { metricId: "c", metricLabel: "Median household income", rank: 8 }
    ],
    worst: [
      { metricId: "x", metricLabel: "Unemployment rate", rank: 40 },
      { metricId: "y", metricLabel: "Gasoline cost", rank: 45 },
      { metricId: "z", metricLabel: "Taxes per capita", rank: 49 }
    ]
  }
];

describe("ChoroplethMap", () => {
  it("shows a state stackup tooltip on hover and routes into the states explorer on click", () => {
    render(<ChoroplethMap rows={rows} stateSummaries={stateSummaries} />);

    const geography = screen.getByTestId("geography-06");

    fireEvent.mouseEnter(geography, {
      clientX: 120,
      clientY: 140
    });

    expect(screen.getByText("California")).toBeInTheDocument();
    expect(screen.getByText("Best 3")).toBeInTheDocument();
    expect(screen.getByText("Worst 3")).toBeInTheDocument();
    expect(screen.getByText("Payroll job growth")).toBeInTheDocument();
    expect(screen.getByText("Rank #49")).toBeInTheDocument();

    fireEvent.click(geography);

    expect(push).toHaveBeenCalledWith("/states?state=california");
  });
});
