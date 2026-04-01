import { fetchText, parseDelimited } from "@/lib/ingest/http";

type PopulationRow = Record<string, string>;

const POPULATION_URLS = [
  "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv",
  "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/state/totals/NST-EST2024-ALLDATA.csv"
] as const;

let populationMatrixPromise: Promise<Map<number, Map<string, number>>> | null = null;

async function loadPopulationMatrix() {
  for (const url of POPULATION_URLS) {
    try {
      const { body } = await fetchText(url);
      const rows = parseDelimited<PopulationRow>(body, ",").filter(
        (row) => row.SUMLEV === "040"
      );
      const matrix = new Map<number, Map<string, number>>();

      for (const key of Object.keys(rows[0] ?? {})) {
        const match = /^POPESTIMATE(?<year>\d{4})$/.exec(key);

        if (!match?.groups?.year) {
          continue;
        }

        const year = Number.parseInt(match.groups.year, 10);

        matrix.set(
          year,
          new Map(
            rows.flatMap((row) => {
              const value = Number.parseFloat(row[key] ?? "");

              return Number.isFinite(value) ? [[row.STATE, value] as const] : [];
            })
          )
        );
      }

      return matrix;
    } catch {
      continue;
    }
  }

  throw new Error("Unable to resolve Census state population totals.");
}

export async function fetchStatePopulationMap(year: number) {
  populationMatrixPromise ??= loadPopulationMatrix();
  const matrix = await populationMatrixPromise;
  const map = matrix.get(year);

  if (!map) {
    throw new Error(`Unable to resolve Census population data for ${year}.`);
  }

  return map;
}
