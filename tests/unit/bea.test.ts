import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ingest/http", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ingest/http")>("@/lib/ingest/http");

  return {
    ...actual,
    fetchBuffer: vi.fn(async (url: string) => ({
      body: Buffer.from(url, "utf8"),
      sourceUrl: url,
      lastModified: new Date(Date.UTC(2026, 3, 1))
    }))
  };
});

vi.mock("@/lib/ingest/zip", () => ({
  unzipTextEntries: vi.fn((body: Buffer) => {
    const key = body.toString("utf8");

    if (key.includes("SQGDP.zip")) {
      return new Map([
        [
          "SQGDP8__ALL_AREAS_2005_2026.csv",
          [
            "GeoFIPS,GeoName,Region,TableName,LineCode,IndustryClassification,Description,Unit,2024:Q1,2024:Q2,2024:Q3,2024:Q4,2025:Q1",
            '"00000","United States",,SQGDP8,1,"...","All industry total","Millions of chained dollars",100,101,102,103,110',
            '"01000","Alabama",5,SQGDP8,1,"...","All industry total","Millions of chained dollars",10,11,12,13,15'
          ].join("\n")
        ]
      ]);
    }

    return new Map([
      [
        "SARPP_STATE_2008_2025.csv",
        [
          "GeoFIPS,GeoName,Region,TableName,LineCode,IndustryClassification,Description,Unit,2024,2025",
          '"00000","United States",,SARPP,1,"...","RPPs: All items","Index",100,100',
          '"01000","Alabama",5,SARPP,1,"...","RPPs: All items","Index",89,90'
        ].join("\n")
      ]
    ]);
  })
}));

import { beaRealGdpAdapter, beaRppAdapter } from "@/lib/ingest/adapters/bea";

describe("BEA adapters", () => {
  it("accepts newer SQGDP all-areas filenames from the ZIP contents", async () => {
    const observations = await beaRealGdpAdapter.fetchObservations();

    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      metricId: "real_gdp_growth",
      jurisdictionFips: "01",
      periodKey: "2025-Q1",
      value: 50,
      benchmarkValue: 10
    });
  });

  it("accepts newer SARPP state filenames from the ZIP contents", async () => {
    const observations = await beaRppAdapter.fetchObservations();

    expect(observations).toHaveLength(2);
    expect(observations.find((item) => item.periodKey === "2025")).toMatchObject({
      metricId: "cost_of_living_index",
      jurisdictionFips: "01",
      value: 90,
      benchmarkValue: 100
    });
  });
});
