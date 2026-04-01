import { OverviewClient } from "@/components/overview-client";
import { getLatestRanking, getMetadata } from "@/lib/data/queries";
import { DEFAULT_METRIC_ID } from "@/lib/metrics/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { metrics, refreshStatus } = await getMetadata();
  const overview = await getLatestRanking(DEFAULT_METRIC_ID);

  return (
    <OverviewClient
      metrics={metrics}
      refreshStatus={refreshStatus}
      initialMetric={overview.metric}
      initialRows={overview.rows}
    />
  );
}
