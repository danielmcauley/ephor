import type { BetterDirection } from "@/lib/metrics/catalog";
import type { MetricObservation, RankingRow } from "@/lib/types";

export function rankObservations(
  observations: MetricObservation[],
  betterDirection: BetterDirection
): RankingRow[] {
  const sorted = [...observations].sort((left, right) => {
    const comparison =
      betterDirection === "HIGHER" ? right.value - left.value : left.value - right.value;

    if (comparison !== 0) {
      return comparison;
    }

    return left.jurisdiction.name.localeCompare(right.jurisdiction.name);
  });

  const total = sorted.length;

  return sorted.map((observation, index) => {
    const previous = sorted[index - 1];
    const tied = previous ? previous.value === observation.value : false;
    const rank = tied ? rankObservationsCompetitionRank(sorted, index) : index + 1;
    const percentile = total <= 1 ? 100 : ((total - rank) / (total - 1)) * 100;

    return {
      rank,
      tied,
      jurisdiction: observation.jurisdiction,
      value: observation.value,
      benchmarkValue: observation.benchmarkValue,
      deltaFromBenchmark:
        observation.benchmarkValue == null ? null : observation.value - observation.benchmarkValue,
      percentile,
      periodLabel: observation.periodLabel,
      releaseDate: observation.releaseDate,
      sourceUrl: observation.sourceUrl
    };
  });
}

function rankObservationsCompetitionRank(sorted: MetricObservation[], index: number) {
  const current = sorted[index];

  for (let pointer = index; pointer >= 0; pointer -= 1) {
    const candidate = sorted[pointer];
    const equal = candidate.value === current.value;

    if (!equal) {
      return pointer + 2;
    }

    if (pointer === 0) {
      return 1;
    }
  }

  return index + 1;
}
