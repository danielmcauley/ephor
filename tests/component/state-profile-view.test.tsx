import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StateProfileView } from "@/components/state-profile-view";
import type { StateProfile } from "@/lib/types";

function makeMetric(id: string, label: string, rank: number) {
  return {
    definition: {
      id,
      label,
      category: "People & Affordability" as const,
      sourceName: "Source",
      sourceUrl: "https://example.gov",
      cadence: "ANNUAL" as const,
      betterDirection: "LOWER" as const,
      unit: "percent" as const,
      description: "desc",
      caveats: null,
      methodology: "method"
    },
    latest: {
      rank,
      tied: false,
      jurisdiction: {
        slug: "colorado",
        name: "Colorado",
        abbr: "CO",
        fips: "08"
      },
      value: rank,
      benchmarkValue: null,
      deltaFromBenchmark: null,
      percentile: 100 - rank,
      periodLabel: "2025",
      releaseDate: null,
      sourceUrl: "https://example.gov"
    },
    trend: []
  };
}

const profile: StateProfile = {
  jurisdiction: {
    slug: "colorado",
    name: "Colorado",
    abbr: "CO",
    fips: "08"
  },
  metrics: [
    makeMetric("payroll_growth", "Payroll job growth", 4),
    makeMetric("poverty_rate", "Poverty rate", 45)
  ]
};

const orderedProfile: StateProfile = {
  jurisdiction: {
    slug: "texas",
    name: "Texas",
    abbr: "TX",
    fips: "48"
  },
  metrics: [
    makeMetric("payroll_growth", "Payroll job growth", 15),
    makeMetric("gasoline_cost", "Gasoline cost", 1),
    makeMetric("unemployment_rate", "Unemployment rate", 14),
    makeMetric("cost_of_living_index", "Cost of living index", 16),
    makeMetric("poverty_rate", "Poverty rate", 39),
    makeMetric("taxes_per_capita", "Taxes per capita", 4)
  ]
};

describe("StateProfileView", () => {
  afterEach(() => {
    cleanup();
  });

  it("surfaces a quick ranking summary for the selected state", () => {
    render(<StateProfileView profile={profile} showHeading={false} />);

    expect(screen.getByText("Best standing")).toBeInTheDocument();
    expect(screen.getAllByText("Payroll job growth").length).toBeGreaterThan(0);
    expect(screen.getByText("Rank #4")).toBeInTheDocument();
    expect(screen.getByText("Weakest standing")).toBeInTheDocument();
    expect(screen.getAllByText("Poverty rate").length).toBeGreaterThan(0);
    expect(screen.getByText("Rank #45")).toBeInTheDocument();
    expect(
      screen.getByText("Metrics where Colorado is in the national top ten.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Metrics where Colorado is in the bottom ten.")
    ).toBeInTheDocument();
  });

  it("moves taxes, poverty, cost of living, unemployment, and gasoline cost to the top", () => {
    render(<StateProfileView profile={orderedProfile} showHeading={false} />);

    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
        .slice(0, 5)
    ).toEqual([
      "Taxes per capita",
      "Poverty rate",
      "Cost of living index",
      "Unemployment rate",
      "Gasoline cost"
    ]);
  });
});
