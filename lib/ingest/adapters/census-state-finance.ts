import { JURISDICTION_BY_FIPS } from "@/lib/data/jurisdictions";
import { fetchStatePopulationMap } from "@/lib/ingest/adapters/census-population-utils";
import { annualPeriod, fetchBuffer, parseDelimited } from "@/lib/ingest/http";
import { unzipTextEntries } from "@/lib/ingest/zip";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

const STATE_FINANCE_ZIP_URL = "https://www2.census.gov/programs-surveys/state/data/GS00SG01.zip";
const STATE_FINANCE_FILE = "GS00SG01.dat";
const DIRECT_EXPENDITURE_CODE = "SF0022";

type StateFinanceRow = {
  "#YEAR": string;
  ST: string;
  AGG_DESC: string;
  AMOUNT: string;
  GOVTYPE: string;
};

function toAmount(value: string) {
  const parsed = Number.parseFloat(value.replaceAll(",", "").trim());

  return Number.isFinite(parsed) ? parsed : null;
}

export const censusStateFinanceAdapter: SourceAdapter = {
  metricId: "state_spending_per_capita",
  async fetchObservations() {
    const { body, sourceUrl, lastModified } = await fetchBuffer(STATE_FINANCE_ZIP_URL);
    const files = unzipTextEntries(body);
    const data = files.get(STATE_FINANCE_FILE);

    if (!data) {
      throw new Error(`Expected ${STATE_FINANCE_FILE} in Census state finance ZIP.`);
    }

    const rows = parseDelimited<StateFinanceRow>(data, "|");
    const filtered = rows.filter(
      (row) =>
        row.AGG_DESC === DIRECT_EXPENDITURE_CODE &&
        row.GOVTYPE === "002" &&
        row.ST !== "00"
    );
    const years = [...new Set(filtered.map((row) => Number.parseInt(row["#YEAR"], 10)))]
      .filter((year) => year >= 2020)
      .sort((left, right) => left - right)
      .slice(-5);
    const populationMaps = new Map(
      await Promise.all(
        years.map(async (year) => [year, await fetchStatePopulationMap(year)] as const)
      )
    );
    const observations: SourceObservation[] = [];

    for (const row of filtered) {
      const year = Number.parseInt(row["#YEAR"], 10);
      const amount = toAmount(row.AMOUNT);
      const jurisdiction = JURISDICTION_BY_FIPS.get(row.ST);
      const population = populationMaps.get(year)?.get(row.ST) ?? null;

      if (
        !years.includes(year) ||
        !jurisdiction ||
        amount == null ||
        population == null ||
        population <= 0
      ) {
        continue;
      }

      observations.push({
        metricId: "state_spending_per_capita",
        jurisdictionFips: jurisdiction.fips,
        ...annualPeriod(year),
        value: (amount * 1_000) / population,
        releaseDate: lastModified ?? null,
        sourceUrl,
        metadata: {
          aggregateCode: DIRECT_EXPENDITURE_CODE,
          directExpenditureThousands: amount
        }
      });
    }

    return observations;
  }
};
