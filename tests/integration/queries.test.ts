import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    metricDefinition: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    metricObservation: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    refreshRun: {
      findMany: vi.fn()
    },
    jurisdiction: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock
}));

import { getLatestRanking } from "@/lib/data/queries";

describe("data queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns latest ranking sorted by metric direction with tie handling", async () => {
    prismaMock.metricDefinition.findUnique.mockResolvedValue({
      id: "unemployment_rate",
      label: "Unemployment rate",
      category: "Economy",
      sourceName: "BLS",
      sourceUrl: "https://bls.gov",
      cadence: "MONTHLY",
      betterDirection: "LOWER",
      unit: "percent",
      description: "desc",
      caveats: null,
      methodology: "method",
      defaultMetric: false
    });
    prismaMock.metricObservation.findFirst.mockResolvedValue({
      periodKey: "2026-01",
      periodLabel: "Jan 2026"
    });
    prismaMock.metricObservation.findMany.mockResolvedValue([
      {
        metricId: "unemployment_rate",
        periodKey: "2026-01",
        periodLabel: "Jan 2026",
        periodStart: new Date(Date.UTC(2026, 0, 1)),
        periodEnd: new Date(Date.UTC(2026, 0, 31)),
        value: { toNumber: () => 4.8 },
        benchmarkValue: null,
        benchmarkLabel: null,
        releaseDate: null,
        sourceUrl: "https://bls.gov",
        ingestedAt: new Date(Date.UTC(2026, 1, 1)),
        jurisdiction: {
          slug: "california",
          name: "California",
          abbr: "CA",
          fips: "06"
        }
      },
      {
        metricId: "unemployment_rate",
        periodKey: "2026-01",
        periodLabel: "Jan 2026",
        periodStart: new Date(Date.UTC(2026, 0, 1)),
        periodEnd: new Date(Date.UTC(2026, 0, 31)),
        value: { toNumber: () => 4.8 },
        benchmarkValue: null,
        benchmarkLabel: null,
        releaseDate: null,
        sourceUrl: "https://bls.gov",
        ingestedAt: new Date(Date.UTC(2026, 1, 1)),
        jurisdiction: {
          slug: "alabama",
          name: "Alabama",
          abbr: "AL",
          fips: "01"
        }
      },
      {
        metricId: "unemployment_rate",
        periodKey: "2026-01",
        periodLabel: "Jan 2026",
        periodStart: new Date(Date.UTC(2026, 0, 1)),
        periodEnd: new Date(Date.UTC(2026, 0, 31)),
        value: { toNumber: () => 3.2 },
        benchmarkValue: null,
        benchmarkLabel: null,
        releaseDate: null,
        sourceUrl: "https://bls.gov",
        ingestedAt: new Date(Date.UTC(2026, 1, 1)),
        jurisdiction: {
          slug: "colorado",
          name: "Colorado",
          abbr: "CO",
          fips: "08"
        }
      }
    ]);

    const ranking = await getLatestRanking("unemployment_rate");

    expect(ranking.rows.map((row) => [row.jurisdiction.name, row.rank])).toEqual([
      ["Colorado", 1],
      ["Alabama", 2],
      ["California", 2]
    ]);
  });
});
