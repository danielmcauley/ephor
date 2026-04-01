import { JURISDICTION_BY_FIPS } from "@/lib/data/jurisdictions";
import { annualPeriod, fetchJson } from "@/lib/ingest/http";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

type CensusResponse = string[][];

async function fetchCensus(year: number, dataset: string, params: Record<string, string>) {
  const url = new URL(`https://api.census.gov/data/${year}/${dataset}`);
  const apiKey = process.env.CENSUS_API_KEY;

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  return fetchJson<CensusResponse>(url.toString());
}

async function resolveLatestAcsYear() {
  const currentYear = new Date().getUTCFullYear();

  for (let candidate = currentYear; candidate >= currentYear - 4; candidate -= 1) {
    try {
      await fetchCensus(candidate, "acs/acs1/profile", {
        get: "NAME,DP03_0062E",
        "for": "state:*"
      });
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error("Unable to resolve latest ACS 1-year vintage.");
}

function rowsToObjects(headers: string[], rows: string[][]) {
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])) as Record<
      string,
      string
    >
  );
}

function parseValue(value: string) {
  return Number.parseFloat(value);
}

export const censusAcsAdapter: SourceAdapter = {
  metricId: "median_household_income",
  async fetchObservations() {
    const year = await resolveLatestAcsYear();
    const [profile, poverty, attainment, nationalProfile, nationalPoverty, nationalAttainment] =
      await Promise.all([
        fetchCensus(year, "acs/acs1/profile", {
          get: "NAME,DP03_0062E",
          "for": "state:*"
        }),
        fetchCensus(year, "acs/acs1/subject", {
          get: "NAME,S1701_C03_001E",
          "for": "state:*"
        }),
        fetchCensus(year, "acs/acs1/subject", {
          get: "NAME,S1501_C02_015E",
          "for": "state:*"
        }),
        fetchCensus(year, "acs/acs1/profile", {
          get: "NAME,DP03_0062E",
          "for": "us:1"
        }),
        fetchCensus(year, "acs/acs1/subject", {
          get: "NAME,S1701_C03_001E",
          "for": "us:1"
        }),
        fetchCensus(year, "acs/acs1/subject", {
          get: "NAME,S1501_C02_015E",
          "for": "us:1"
        })
      ]);

    const period = annualPeriod(year);
    const profileRows = rowsToObjects(profile[0], profile.slice(1));
    const povertyRows = rowsToObjects(poverty[0], poverty.slice(1));
    const attainmentRows = rowsToObjects(attainment[0], attainment.slice(1));
    const povertyByState = new Map(povertyRows.map((row) => [row.state, row]));
    const attainmentByState = new Map(attainmentRows.map((row) => [row.state, row]));
    const nationalIncome = parseValue(nationalProfile[1][1]);
    const nationalPovertyRate = parseValue(nationalPoverty[1][1]);
    const nationalAttainmentRate = parseValue(nationalAttainment[1][1]);

    const observations: SourceObservation[] = [];

    for (const row of profileRows) {
      const jurisdiction = JURISDICTION_BY_FIPS.get(row.state);

      if (!jurisdiction) {
        continue;
      }

      const povertyRow = povertyByState.get(row.state);
      const attainmentRow = attainmentByState.get(row.state);

      observations.push({
        metricId: "median_household_income",
        jurisdictionFips: jurisdiction.fips,
        ...period,
        value: parseValue(row.DP03_0062E),
        benchmarkValue: nationalIncome,
        benchmarkLabel: "U.S. median household income",
        releaseDate: new Date(Date.UTC(year + 1, 8, 1)),
        sourceUrl: `https://api.census.gov/data/${year}/acs/acs1/profile`
      });

      if (povertyRow) {
        observations.push({
          metricId: "poverty_rate",
          jurisdictionFips: jurisdiction.fips,
          ...period,
          value: parseValue(povertyRow.S1701_C03_001E),
          benchmarkValue: nationalPovertyRate,
          benchmarkLabel: "U.S. poverty rate",
          releaseDate: new Date(Date.UTC(year + 1, 8, 1)),
          sourceUrl: `https://api.census.gov/data/${year}/acs/acs1/subject`
        });
      }

      if (attainmentRow) {
        observations.push({
          metricId: "bachelors_attainment",
          jurisdictionFips: jurisdiction.fips,
          ...period,
          value: parseValue(attainmentRow.S1501_C02_015E),
          benchmarkValue: nationalAttainmentRate,
          benchmarkLabel: "U.S. bachelor's attainment",
          releaseDate: new Date(Date.UTC(year + 1, 8, 1)),
          sourceUrl: `https://api.census.gov/data/${year}/acs/acs1/subject`
        });
      }
    }

    return observations;
  }
};
