import { JURISDICTION_BY_FIPS } from "@/lib/data/jurisdictions";
import { fetchText, monthPeriod, parseDelimited } from "@/lib/ingest/http";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

const CES_URL = "https://download.bls.gov/pub/time.series/SM/sm.data.55.TotalNonFarmStatewide.All";
const CES_PATTERN = /^SMS(?<fips>\d{2})0+01$/;

type CesRecord = {
  series_id: string;
  year: string;
  period: string;
  value: string;
};

export const blsCesAdapter: SourceAdapter = {
  metricId: "payroll_growth",
  async fetchObservations() {
    const { body, sourceUrl, lastModified } = await fetchText(CES_URL);
    const rows = parseDelimited<CesRecord>(body);
    const cutoffYear = new Date().getUTCFullYear() - 7;
    const grouped = new Map<string, Array<{ year: number; month: number; value: number }>>();

    for (const row of rows) {
      const match = CES_PATTERN.exec(row.series_id);
      const fips = match?.groups?.fips;
      const year = Number.parseInt(row.year, 10);
      const month = Number.parseInt(row.period.slice(1), 10);

      if (!fips || month < 1 || month > 12 || year < cutoffYear) {
        continue;
      }

      const bucket = grouped.get(fips) ?? [];
      bucket.push({
        year,
        month,
        value: Number.parseFloat(row.value)
      });
      grouped.set(fips, bucket);
    }

    const observations: SourceObservation[] = [];

    for (const [fips, values] of grouped.entries()) {
      const jurisdiction = JURISDICTION_BY_FIPS.get(fips);

      if (!jurisdiction) {
        continue;
      }

      values.sort((left, right) => left.year - right.year || left.month - right.month);

      for (const current of values) {
        const prior = values.find(
          (candidate) => candidate.year === current.year - 1 && candidate.month === current.month
        );

        if (!prior) {
          continue;
        }

        const period = monthPeriod(current.year, current.month - 1);

        observations.push({
          metricId: "payroll_growth",
          jurisdictionFips: jurisdiction.fips,
          ...period,
          value: ((current.value - prior.value) / prior.value) * 100,
          releaseDate: lastModified ?? null,
          sourceUrl,
          metadata: {
            payrollLevel: current.value
          }
        });
      }
    }

    return observations;
  }
};
