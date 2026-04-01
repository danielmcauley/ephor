import { describe, expect, it } from "vitest";

import { rankObservations } from "@/lib/metrics/ranking";
import type { MetricObservation } from "@/lib/types";

function makeObservation(name: string, slug: string, value: number): MetricObservation {
  return {
    jurisdiction: {
      slug,
      name,
      abbr: name.slice(0, 2).toUpperCase(),
      fips: "01"
    },
    metricId: "sample",
    periodKey: "2026-01",
    periodLabel: "Jan 2026",
    periodStart: new Date(Date.UTC(2026, 0, 1)).toISOString(),
    periodEnd: new Date(Date.UTC(2026, 0, 31)).toISOString(),
    value,
    benchmarkValue: null,
    benchmarkLabel: null,
    releaseDate: null,
    sourceUrl: "https://example.gov",
    ingestedAt: new Date().toISOString()
  };
}

describe("rankObservations", () => {
  it("ranks higher-is-better metrics descending and preserves competition ranking for ties", () => {
    const rows = rankObservations(
      [
        makeObservation("Colorado", "colorado", 8),
        makeObservation("Alabama", "alabama", 10),
        makeObservation("California", "california", 10),
        makeObservation("Delaware", "delaware", 6)
      ],
      "HIGHER"
    );

    expect(rows.map((row) => [row.jurisdiction.name, row.rank])).toEqual([
      ["Alabama", 1],
      ["California", 1],
      ["Colorado", 3],
      ["Delaware", 4]
    ]);
  });

  it("ranks lower-is-better metrics ascending", () => {
    const rows = rankObservations(
      [
        makeObservation("Colorado", "colorado", 4.3),
        makeObservation("Alabama", "alabama", 3.1),
        makeObservation("California", "california", 4.8)
      ],
      "LOWER"
    );

    expect(rows.map((row) => [row.jurisdiction.name, row.rank])).toEqual([
      ["Alabama", 1],
      ["Colorado", 2],
      ["California", 3]
    ]);
  });
});
