import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ingest/http", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ingest/http")>("@/lib/ingest/http");

  return {
    ...actual,
    fetchText: vi.fn(async () => ({
      body: [
        "Data_Status,State,MSN,2022,2023",
        "2023F,US,MGACD,32.39,29.00",
        "2023F,CA,MGACD,42.81,38.64",
        "2023F,DC,MGACD,34.41,30.61",
        "2023F,CA,CLACD,0,0"
      ].join("\n"),
      sourceUrl: "https://www.eia.gov/state/seds/sep_prices/total/csv/pr_all.csv",
      lastModified: new Date(Date.UTC(2025, 4, 28))
    }))
  };
});

import { eiaGasolineAdapter } from "@/lib/ingest/adapters/eia-gasoline";

describe("eiaGasolineAdapter", () => {
  it("parses the official motor gasoline price series by state", async () => {
    const observations = await eiaGasolineAdapter.fetchObservations();

    expect(observations).toHaveLength(4);
    expect(observations.find((item) => item.jurisdictionFips === "06" && item.periodKey === "2023")).toMatchObject({
      metricId: "gasoline_cost",
      value: 38.64,
      benchmarkValue: 29
    });
    expect(observations.find((item) => item.jurisdictionFips === "11" && item.periodKey === "2022")).toMatchObject({
      value: 34.41,
      benchmarkValue: 32.39
    });
  });
});
