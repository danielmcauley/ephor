import { JURISDICTION_BY_ABBR } from "@/lib/data/jurisdictions";
import { annualPeriod, fetchText, parseDelimited } from "@/lib/ingest/http";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

const EIA_GASOLINE_URL = "https://www.eia.gov/state/seds/sep_prices/total/csv/pr_all.csv";
const GASOLINE_SERIES_CODE = "MGACD";

type EiaPriceRow = Record<string, string>;

function toNumber(value: string) {
  const parsed = Number.parseFloat(value.replaceAll(",", "").trim());

  return Number.isFinite(parsed) ? parsed : null;
}

export const eiaGasolineAdapter: SourceAdapter = {
  metricId: "gasoline_cost",
  async fetchObservations() {
    const { body, sourceUrl, lastModified } = await fetchText(EIA_GASOLINE_URL);
    const rows = parseDelimited<EiaPriceRow>(body, ",");
    const seriesRows = rows.filter((row) => row.MSN === GASOLINE_SERIES_CODE);
    const nationalRow = seriesRows.find((row) => row.State === "US");

    if (!nationalRow) {
      throw new Error("EIA SEDS price file did not include a U.S. motor gasoline series.");
    }

    const years = Object.keys(nationalRow)
      .filter((key) => /^\d{4}$/.test(key))
      .sort();
    const nationalByYear = new Map(
      years.flatMap((year) => {
        const value = toNumber(nationalRow[year] ?? "");

        return value == null ? [] : [[year, value] as const];
      })
    );

    return seriesRows.flatMap((row) => {
      const jurisdiction = JURISDICTION_BY_ABBR.get(row.State);

      if (!jurisdiction) {
        return [];
      }

      return years.flatMap((year) => {
        const value = toNumber(row[year] ?? "");

        if (value == null) {
          return [];
        }

        return [
          {
            metricId: "gasoline_cost",
            jurisdictionFips: jurisdiction.fips,
            ...annualPeriod(Number.parseInt(year, 10)),
            value,
            benchmarkValue: nationalByYear.get(year) ?? null,
            benchmarkLabel: nationalByYear.has(year) ? "U.S. motor gasoline price" : null,
            releaseDate: lastModified ?? null,
            sourceUrl,
            metadata: {
              seriesCode: GASOLINE_SERIES_CODE,
              unit: "dollars per million Btu"
            }
          }
        ];
      });
    });
  }
};
