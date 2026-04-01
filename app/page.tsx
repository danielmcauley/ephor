import { OverviewClient } from "@/components/overview-client";
import {
  getLatestRanking,
  getMetadata,
  getStateStackupSummaries
} from "@/lib/data/queries";
import { DEFAULT_METRIC_ID } from "@/lib/metrics/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ metrics, refreshStatus }, overview, stateSummaries] = await Promise.all([
    getMetadata(),
    getLatestRanking(DEFAULT_METRIC_ID),
    getStateStackupSummaries()
  ]);

  return (
    <OverviewClient
      metrics={metrics}
      refreshStatus={refreshStatus}
      stateSummaries={stateSummaries}
      initialMetric={overview.metric}
      initialRows={overview.rows}
    />
  );
}
