import * as XLSX from "xlsx";

import { JURISDICTIONS } from "@/lib/data/jurisdictions";
import { fetchStatePopulationMap } from "@/lib/ingest/adapters/census-population-utils";
import { annualPeriod, fetchBuffer } from "@/lib/ingest/http";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

const STC_BASE_URL = "https://www2.census.gov/programs-surveys/stc/tables";
const TOTAL_TAXES_CODE = "T00";

function workbookUrl(year: number) {
  return `${STC_BASE_URL}/${year}/FY${year}-STC-Category-Table-Transposed.xlsx`;
}

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

function headerToJurisdiction(value: unknown) {
  const normalized = String(value ?? "").trim();

  return JURISDICTIONS.find(
    (jurisdiction) => jurisdiction.name === normalized || jurisdiction.abbr === normalized
  );
}

async function fetchRecentWorkbooks() {
  const currentYear = new Date().getUTCFullYear() - 1;
  const workbooks = [];

  for (let year = currentYear; year >= currentYear - 6 && workbooks.length < 5; year -= 1) {
    try {
      workbooks.push({
        year,
        ...(await fetchBuffer(workbookUrl(year)))
      });
    } catch {
      continue;
    }
  }

  if (workbooks.length === 0) {
    throw new Error("Unable to resolve a Census state tax collections workbook.");
  }

  return workbooks.sort((left, right) => left.year - right.year);
}

export const censusTaxesAdapter: SourceAdapter = {
  metricId: "taxes_per_capita",
  async fetchObservations() {
    const workbooks = await fetchRecentWorkbooks();
    const populationMaps = new Map(
      await Promise.all(
        workbooks.map(async ({ year }) => [year, await fetchStatePopulationMap(year)] as const)
      )
    );
    const observations: SourceObservation[] = [];

    for (const workbookPayload of workbooks) {
      const workbook = XLSX.read(workbookPayload.body, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Array<unknown>>(sheet, {
        header: 1,
        defval: null
      });
      const headerIndex = rows.findIndex(
        (row) => row[0] === "Tax Type" && row[1] === "Tax Code"
      );

      if (headerIndex === -1) {
        continue;
      }

      const header = rows[headerIndex];
      const totalTaxesRow = rows
        .slice(headerIndex + 1)
        .find((row) => row[1] === TOTAL_TAXES_CODE || row[0] === "Total Taxes");

      if (!totalTaxesRow) {
        continue;
      }

      for (let index = 2; index < header.length; index += 1) {
        const jurisdiction = headerToJurisdiction(header[index]);
        const amount = toNumber(totalTaxesRow[index]);
        const population = jurisdiction
          ? populationMaps.get(workbookPayload.year)?.get(jurisdiction.fips) ?? null
          : null;

        if (!jurisdiction || amount == null || population == null || population <= 0) {
          continue;
        }

        observations.push({
          metricId: "taxes_per_capita",
          jurisdictionFips: jurisdiction.fips,
          ...annualPeriod(workbookPayload.year),
          value: (amount * 1_000) / population,
          releaseDate: workbookPayload.lastModified ?? null,
          sourceUrl: workbookPayload.sourceUrl,
          metadata: {
            taxCode: TOTAL_TAXES_CODE,
            totalTaxesThousands: amount
          }
        });
      }
    }

    return observations;
  }
};
