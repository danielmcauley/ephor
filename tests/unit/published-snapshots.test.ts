import { describe, expect, it } from "vitest";

import {
  selectLatestCompleteSnapshot,
  summarizeSourceObservations
} from "@/lib/published-snapshots";

describe("published snapshot helpers", () => {
  it("prefers the latest complete period over a newer incomplete one", () => {
    const summary = summarizeSourceObservations(
      [
        ...Array.from({ length: 51 }, (_, index) => ({
          metricId: "cost_of_living_index",
          jurisdictionFips: String(index + 1).padStart(2, "0"),
          periodKey: "2024",
          periodLabel: "2024",
          periodStart: new Date(Date.UTC(2024, 0, 1)),
          periodEnd: new Date(Date.UTC(2024, 11, 31)),
          value: index,
          releaseDate: new Date(Date.UTC(2025, 1, 1)),
          sourceUrl: "https://example.gov"
        })),
        ...Array.from({ length: 45 }, (_, index) => ({
          metricId: "cost_of_living_index",
          jurisdictionFips: String(index + 1).padStart(2, "0"),
          periodKey: "2025",
          periodLabel: "2025",
          periodStart: new Date(Date.UTC(2025, 0, 1)),
          periodEnd: new Date(Date.UTC(2025, 11, 31)),
          value: index,
          releaseDate: new Date(Date.UTC(2026, 1, 1)),
          sourceUrl: "https://example.gov"
        }))
      ],
      51
    ).get("cost_of_living_index");

    expect(summary?.latest?.periodKey).toBe("2025");
    expect(summary?.latest?.rowCount).toBe(45);
    expect(summary?.published?.periodKey).toBe("2024");
    expect(summary?.published?.rowCount).toBe(51);
  });

  it("returns null when no complete snapshot exists", () => {
    expect(
      selectLatestCompleteSnapshot(
        [
          {
            metricId: "payroll_growth",
            periodKey: "2026-02",
            periodLabel: "Feb 2026",
            periodStart: new Date(Date.UTC(2026, 1, 1)),
            periodEnd: new Date(Date.UTC(2026, 1, 28)),
            rowCount: 50,
            releaseDate: null,
            ingestedAt: null
          }
        ],
        51
      )
    ).toBeNull();
  });
});
