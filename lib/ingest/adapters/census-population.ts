import { JURISDICTION_BY_FIPS } from "@/lib/data/jurisdictions";
import { annualPeriod } from "@/lib/ingest/http";
import { fetchStatePopulationMap } from "@/lib/ingest/adapters/census-population-utils";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

async function resolvePopulationSeries() {
  const currentYear = new Date().getUTCFullYear() - 1;

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    try {
      const current = await fetchStatePopulationMap(year);
      const prior = await fetchStatePopulationMap(year - 1);

      return {
        year,
        current,
        prior
      };
    } catch {
      continue;
    }
  }

  throw new Error("Unable to resolve a Census population estimates vintage.");
}
export const censusPopulationAdapter: SourceAdapter = {
  metricId: "population_growth",
  async fetchObservations() {
    const { year, current, prior } = await resolvePopulationSeries();
    const period = annualPeriod(year);

    return Array.from(current.entries()).flatMap(([state, population]) => {
      const previous = prior.get(state);
      const jurisdiction = JURISDICTION_BY_FIPS.get(state);

      if (!jurisdiction || previous == null || previous === 0) {
        return [];
      }

      return [
        {
          metricId: "population_growth",
          jurisdictionFips: jurisdiction.fips,
          ...period,
          value: ((population - previous) / previous) * 100,
          releaseDate: new Date(Date.UTC(year + 1, 4, 1)),
          sourceUrl: `https://api.census.gov/data/${year}/pep/charv`
        }
      ];
    });
  }
};
