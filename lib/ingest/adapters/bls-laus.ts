import { JURISDICTION_BY_FIPS } from "@/lib/data/jurisdictions";
import { fetchText, monthPeriod, parseDelimited } from "@/lib/ingest/http";
import type { SourceAdapter } from "@/lib/ingest/types";

const LAUS_URL = "https://download.bls.gov/pub/time.series/LA/la.data.3.AllStatesS";
const LAUS_PATTERN = /^LASST(?<fips>\d{2})0{11}03$/;

type LausRecord = {
  series_id: string;
  year: string;
  period: string;
  value: string;
  footnote_codes?: string;
};

export const blsLausAdapter: SourceAdapter = {
  metricId: "unemployment_rate",
  async fetchObservations() {
    const { body, sourceUrl, lastModified } = await fetchText(LAUS_URL);
    const records = parseDelimited<LausRecord>(body);
    const cutoffYear = new Date().getUTCFullYear() - 6;

    return records.flatMap((record) => {
      const match = LAUS_PATTERN.exec(record.series_id);
      const fips = match?.groups?.fips;
      const month = Number.parseInt(record.period.slice(1), 10);
      const year = Number.parseInt(record.year, 10);

      if (!fips || month < 1 || month > 12 || year < cutoffYear) {
        return [];
      }

      const jurisdiction = JURISDICTION_BY_FIPS.get(fips);

      if (!jurisdiction) {
        return [];
      }

      const value = Number.parseFloat(record.value);

      if (!Number.isFinite(value)) {
        return [];
      }

      const period = monthPeriod(year, month - 1);

      return [
        {
          metricId: "unemployment_rate",
          jurisdictionFips: jurisdiction.fips,
          ...period,
          value,
          releaseDate: lastModified ?? null,
          sourceUrl
        }
      ];
    });
  }
};
