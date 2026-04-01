import { RankingsTable } from "@/components/rankings-table";
import { getLatestRanking, getMetadata } from "@/lib/data/queries";
import { DEFAULT_METRIC_ID } from "@/lib/metrics/catalog";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const { metrics } = await getMetadata();
  const ranking = await getLatestRanking(DEFAULT_METRIC_ID);

  return (
    <RankingsTable
      metrics={metrics}
      initialMetric={ranking.metric}
      initialRows={ranking.rows}
    />
  );
}
