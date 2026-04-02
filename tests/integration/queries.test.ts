import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    metricDefinition: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    metricObservation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn()
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

import { getLatestRanking, getMetadata } from "@/lib/data/queries";

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
    prismaMock.metricObservation.groupBy.mockResolvedValue([
      {
        metricId: "unemployment_rate",
        periodKey: "2026-02",
        periodLabel: "Feb 2026",
        periodStart: new Date(Date.UTC(2026, 1, 1)),
        periodEnd: new Date(Date.UTC(2026, 1, 28)),
        _count: { _all: 50 },
        _max: {
          releaseDate: new Date(Date.UTC(2026, 2, 1)),
          ingestedAt: new Date(Date.UTC(2026, 2, 1))
        }
      },
      {
        metricId: "unemployment_rate",
        periodKey: "2026-01",
        periodLabel: "Jan 2026",
        periodStart: new Date(Date.UTC(2026, 0, 1)),
        periodEnd: new Date(Date.UTC(2026, 0, 31)),
        _count: { _all: 51 },
        _max: {
          releaseDate: new Date(Date.UTC(2026, 1, 1)),
          ingestedAt: new Date(Date.UTC(2026, 1, 1))
        }
      }
    ]);
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

    expect(prismaMock.metricObservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          metricId: "unemployment_rate",
          periodKey: "2026-01"
        })
      })
    );
    expect(ranking.rows.map((row) => [row.jurisdiction.name, row.rank])).toEqual([
      ["Colorado", 1],
      ["Alabama", 2],
      ["California", 2]
    ]);
  });

  it("puts cost of living first in metadata and treats it as the default metric", async () => {
    prismaMock.metricDefinition.findMany.mockResolvedValue([
      {
        id: "bachelors_attainment",
        label: "Bachelor's attainment",
        category: "People & Affordability",
        sourceName: "Census",
        sourceUrl: "https://example.gov",
        cadence: "ANNUAL",
        betterDirection: "HIGHER",
        unit: "percent",
        description: "desc",
        caveats: null,
        methodology: "method",
        defaultMetric: false
      },
      {
        id: "cost_of_living_index",
        label: "Cost of living index",
        category: "People & Affordability",
        sourceName: "BEA",
        sourceUrl: "https://example.gov",
        cadence: "ANNUAL",
        betterDirection: "LOWER",
        unit: "index",
        description: "desc",
        caveats: null,
        methodology: "method",
        defaultMetric: false
      },
      {
        id: "payroll_growth",
        label: "Payroll job growth",
        category: "Economy",
        sourceName: "BLS",
        sourceUrl: "https://example.gov",
        cadence: "MONTHLY",
        betterDirection: "HIGHER",
        unit: "percent",
        description: "desc",
        caveats: null,
        methodology: "method",
        defaultMetric: true
      }
    ]);
    prismaMock.refreshRun.findMany.mockResolvedValue([]);
    prismaMock.metricObservation.groupBy.mockResolvedValue([]);

    const metadata = await getMetadata();

    expect(metadata.metrics[0]?.id).toBe("cost_of_living_index");
    expect(metadata.metrics[0]?.defaultMetric).toBe(true);
    expect(metadata.metrics.find((metric) => metric.id === "payroll_growth")?.defaultMetric).toBe(
      false
    );
  });
});
