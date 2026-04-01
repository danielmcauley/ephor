import { parse } from "csv-parse/sync";

import { JURISDICTION_BY_FIPS } from "@/lib/data/jurisdictions";
import { annualPeriod, fetchBuffer, quarterPeriod } from "@/lib/ingest/http";
import { unzipTextEntries } from "@/lib/ingest/zip";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

const SARPP_ZIP_URL = "https://apps.bea.gov/regional/zip/SARPP.zip";
const SQGDP_ZIP_URL = "https://apps.bea.gov/regional/zip/SQGDP.zip";

type BeaWideRow = Record<string, string>;

function parseBeaNumber(value: string) {
  return Number.parseFloat(value.replaceAll(",", "").replaceAll('"', "").trim());
}

function normalizeGeoFips(value: string) {
  const cleaned = value.replaceAll('"', "").trim();

  if (cleaned === "00000") {
    return "00";
  }

  if (/^\d{5}$/.test(cleaned)) {
    return cleaned.slice(0, 2);
  }

  return null;
}

function quarterKeys(row: BeaWideRow) {
  return Object.keys(row)
    .filter((key) => /^\d{4}:Q[1-4]$/.test(key))
    .sort();
}

function yearKeys(row: BeaWideRow) {
  return Object.keys(row)
    .filter((key) => /^\d{4}$/.test(key))
    .sort();
}

function quarterSeries(row: BeaWideRow) {
  return quarterKeys(row).flatMap((key) => {
    const value = parseBeaNumber(row[key] ?? "");

    return Number.isFinite(value) ? [{ period: key, value }] : [];
  });
}

function growthByQuarter(series: Array<{ period: string; value: number }>) {
  const growth = new Map<string, number>();

  for (let index = 4; index < series.length; index += 1) {
    const current = series[index];
    const prior = series[index - 4];

    if (prior.value === 0) {
      continue;
    }

    growth.set(current.period, ((current.value - prior.value) / prior.value) * 100);
  }

  return growth;
}

function parseBeaCsv(body: string) {
  return parse(body, {
    columns: true,
    delimiter: ",",
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true
  }).filter((row: BeaWideRow) => row.GeoFIPS) as BeaWideRow[];
}

function latestBeaCsv(files: Map<string, string>, pattern: RegExp, label: string) {
  const matches = [...files.entries()].filter(([name]) => {
    const basename = name.split("/").pop() ?? name;
    return pattern.test(basename);
  });

  if (matches.length === 0) {
    throw new Error(`Expected a ${label} CSV in BEA ZIP.`);
  }

  matches.sort(([leftName], [rightName]) => compareBeaVintages(leftName, rightName));

  return matches.at(-1)?.[1] ?? matches[0][1];
}

function compareBeaVintages(leftName: string, rightName: string) {
  const leftYears = extractYearRange(leftName);
  const rightYears = extractYearRange(rightName);

  if (!leftYears && !rightYears) {
    return leftName.localeCompare(rightName);
  }

  if (!leftYears) {
    return -1;
  }

  if (!rightYears) {
    return 1;
  }

  if (leftYears.end !== rightYears.end) {
    return leftYears.end - rightYears.end;
  }

  if (leftYears.start !== rightYears.start) {
    return leftYears.start - rightYears.start;
  }

  return leftName.localeCompare(rightName);
}

function extractYearRange(filename: string) {
  const basename = filename.split("/").pop() ?? filename;
  const match = basename.match(/_(\d{4})_(\d{4})\.csv$/i);

  if (!match) {
    return null;
  }

  return {
    start: Number.parseInt(match[1], 10),
    end: Number.parseInt(match[2], 10)
  };
}

export const beaRealGdpAdapter: SourceAdapter = {
  metricId: "real_gdp_growth",
  async fetchObservations() {
    const { body, sourceUrl, lastModified } = await fetchBuffer(SQGDP_ZIP_URL);
    const files = unzipTextEntries(body);
    const csv = latestBeaCsv(
      files,
      /^SQGDP8__ALL_AREAS_\d{4}_\d{4}\.csv$/i,
      "SQGDP8 all-areas"
    );

    const rows = parseBeaCsv(csv);
    const nationalRow = rows.find(
      (row) => normalizeGeoFips(row.GeoFIPS ?? "") === "00" && row.LineCode?.trim() === "1"
    );

    if (!nationalRow) {
      throw new Error("BEA SQGDP ZIP did not include the U.S. all-industry series.");
    }

    const nationalGrowth = growthByQuarter(quarterSeries(nationalRow));
    const observations: SourceObservation[] = [];

    for (const row of rows) {
      const fips = normalizeGeoFips(row.GeoFIPS ?? "");

      if (!fips || fips === "00" || row.LineCode?.trim() !== "1") {
        continue;
      }

      const jurisdiction = JURISDICTION_BY_FIPS.get(fips);

      if (!jurisdiction) {
        continue;
      }

      for (const [periodKey, value] of growthByQuarter(quarterSeries(row)).entries()) {
        const [yearText, quarterText] = periodKey.split(":Q");
        const year = Number.parseInt(yearText, 10);
        const quarter = Number.parseInt(quarterText, 10);

        observations.push({
          metricId: "real_gdp_growth",
          jurisdictionFips: jurisdiction.fips,
          ...quarterPeriod(year, quarter),
          value,
          benchmarkValue: nationalGrowth.get(periodKey) ?? null,
          benchmarkLabel: nationalGrowth.has(periodKey) ? "U.S. real GDP growth" : null,
          releaseDate: lastModified ?? null,
          sourceUrl,
          metadata: {
            table: "SQGDP8",
            series: "All industry total"
          }
        });
      }
    }

    return observations;
  }
};

export const beaRppAdapter: SourceAdapter = {
  metricId: "cost_of_living_index",
  async fetchObservations() {
    const { body, sourceUrl, lastModified } = await fetchBuffer(SARPP_ZIP_URL);
    const files = unzipTextEntries(body);
    const csv = latestBeaCsv(files, /^SARPP_STATE_\d{4}_\d{4}\.csv$/i, "SARPP state");

    const rows = parseBeaCsv(csv);
    const observations: SourceObservation[] = [];

    for (const row of rows) {
      const fips = normalizeGeoFips(row.GeoFIPS ?? "");

      if (!fips || fips === "00" || row.LineCode?.trim() !== "1") {
        continue;
      }

      const jurisdiction = JURISDICTION_BY_FIPS.get(fips);

      if (!jurisdiction) {
        continue;
      }

      for (const key of yearKeys(row)) {
        const value = parseBeaNumber(row[key] ?? "");

        if (!Number.isFinite(value)) {
          continue;
        }

        const year = Number.parseInt(key, 10);

        observations.push({
          metricId: "cost_of_living_index",
          jurisdictionFips: jurisdiction.fips,
          ...annualPeriod(year),
          value,
          benchmarkValue: 100,
          benchmarkLabel: "U.S. average",
          releaseDate: lastModified ?? null,
          sourceUrl,
          metadata: {
            table: "SARPP",
            series: "RPPs: All items"
          }
        });
      }
    }

    return observations;
  }
};
