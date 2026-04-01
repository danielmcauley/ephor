import * as XLSX from "xlsx";

import { JURISDICTION_BY_ABBR } from "@/lib/data/jurisdictions";
import { fetchStatePopulationMap } from "@/lib/ingest/adapters/census-population-utils";
import { annualPeriod, fetchBuffer } from "@/lib/ingest/http";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

const HUD_PIT_URL =
  "https://www.huduser.gov/portal/sites/default/files/xls/2007-2024-PIT-Counts-by-State.xlsb";

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replaceAll(",", "").trim());

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export const hudPitAdapter: SourceAdapter = {
  metricId: "homelessness_rate",
  async fetchObservations() {
    const { body, sourceUrl, lastModified } = await fetchBuffer(HUD_PIT_URL);
    const workbook = XLSX.read(body, { type: "buffer" });
    const years = workbook.SheetNames.filter((name) => /^\d{4}$/.test(name))
      .map((name) => Number.parseInt(name, 10))
      .sort((left, right) => left - right)
      .slice(-5);
    const populationMaps = new Map(
      await Promise.all(
        years.map(async (year) => [year, await fetchStatePopulationMap(year)] as const)
      )
    );
    const observations: SourceObservation[] = [];

    for (const year of years) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        workbook.Sheets[String(year)],
        { defval: null }
      );
      const populationMap = populationMaps.get(year);

      if (!populationMap) {
        continue;
      }

      for (const row of rows) {
        const abbr = String(row.State ?? "").trim();
        const jurisdiction = JURISDICTION_BY_ABBR.get(abbr);
        const homelessCount = toNumber(row["Overall Homeless"]);
        const population = jurisdiction ? populationMap.get(jurisdiction.fips) : null;

        if (!jurisdiction || homelessCount == null || population == null || population <= 0) {
          continue;
        }

        observations.push({
          metricId: "homelessness_rate",
          jurisdictionFips: jurisdiction.fips,
          ...annualPeriod(year),
          value: (homelessCount / population) * 10_000,
          releaseDate: lastModified ?? null,
          sourceUrl,
          metadata: {
            homelessCount,
            population
          }
        });
      }
    }

    return observations;
  }
};
