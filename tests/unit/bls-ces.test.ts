import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ingest/http", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ingest/http")>("@/lib/ingest/http");

  return {
    ...actual,
    fetchText: vi.fn(async () => ({
      body: [
        "series_id\tyear\tperiod\tvalue",
        "SMS01000000000000001\t2024\tM01\t100.0",
        "SMS01000000000000001\t2025\tM01\t110.0",
        "SMS11000000000000001\t2024\tM01\t200.0",
        "SMS11000000000000001\t2025\tM01\t210.0"
      ].join("\n"),
      sourceUrl: "https://download.bls.gov/pub/time.series/SM/sm.data.55.TotalNonFarmStatewide.All",
      lastModified: new Date(Date.UTC(2025, 1, 1))
    }))
  };
});

import { blsCesAdapter } from "@/lib/ingest/adapters/bls-ces";

describe("blsCesAdapter", () => {
  it("computes year-over-year payroll growth for each state", async () => {
    const observations = await blsCesAdapter.fetchObservations();

    expect(observations).toHaveLength(2);
    expect(observations[0]).toMatchObject({
      metricId: "payroll_growth",
      jurisdictionFips: "01",
      value: 10
    });
    expect(observations[1]).toMatchObject({
      jurisdictionFips: "11",
      value: 5
    });
  });
});
