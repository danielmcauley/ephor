import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StateProfileView } from "@/components/state-profile-view";
import type { StateProfile } from "@/lib/types";

const profile: StateProfile = {
  jurisdiction: {
    slug: "colorado",
    name: "Colorado",
    abbr: "CO",
    fips: "08"
  },
  metrics: [
    {
      definition: {
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
        methodology: "method"
      },
      latest: {
        rank: 4,
        tied: false,
        jurisdiction: {
          slug: "colorado",
          name: "Colorado",
          abbr: "CO",
          fips: "08"
        },
        value: 1.4,
        benchmarkValue: null,
        deltaFromBenchmark: null,
        percentile: 94,
        periodLabel: "Dec 2025",
        releaseDate: null,
        sourceUrl: "https://example.gov"
      },
      trend: []
    },
    {
      definition: {
        id: "poverty_rate",
        label: "Poverty rate",
        category: "People & Affordability",
        sourceName: "Census",
        sourceUrl: "https://census.gov",
        cadence: "ANNUAL",
        betterDirection: "LOWER",
        unit: "percent",
        description: "desc",
        caveats: null,
        methodology: "method"
      },
      latest: {
        rank: 45,
        tied: false,
        jurisdiction: {
          slug: "colorado",
          name: "Colorado",
          abbr: "CO",
          fips: "08"
        },
        value: 10.5,
        benchmarkValue: null,
        deltaFromBenchmark: null,
        percentile: 12,
        periodLabel: "2025",
        releaseDate: null,
        sourceUrl: "https://example.gov"
      },
      trend: []
    }
  ]
};

describe("StateProfileView", () => {
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
});
