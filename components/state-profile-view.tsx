import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatMetricValue } from "@/lib/metrics/format";
import type { StateProfile } from "@/lib/types";
import { TrendChart } from "@/components/trend-chart";

type StateProfileViewProps = {
  profile: StateProfile;
  showHeading?: boolean;
};

export function StateProfileView({
  profile,
  showHeading = true
}: StateProfileViewProps) {
  const rankedMetrics = profile.metrics.filter(
    (metric) => metric.latest != null
  );
  const bestMetric = rankedMetrics.reduce<(typeof rankedMetrics)[number] | null>(
    (best, metric) =>
      best == null || metric.latest!.rank < best.latest!.rank ? metric : best,
    null
  );
  const weakestMetric = rankedMetrics.reduce<(typeof rankedMetrics)[number] | null>(
    (weakest, metric) =>
      weakest == null || metric.latest!.rank > weakest.latest!.rank ? metric : weakest,
    null
  );
  const topTenCount = rankedMetrics.filter((metric) => metric.latest!.rank <= 10).length;
  const bottomTenCount = rankedMetrics.filter((metric) => metric.latest!.rank >= 42).length;

  return (
    <div className="space-y-6">
      {showHeading ? (
        <Card className="space-y-3">
          <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">State profile</div>
          <CardTitle className="text-4xl">{profile.jurisdiction.name}</CardTitle>
          <CardDescription>
            Latest rank and recent trend for each MVP metric.
          </CardDescription>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-muted p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Best standing</div>
          <div className="mt-2 text-lg font-semibold">
            {bestMetric ? bestMetric.definition.label : "Waiting for data"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {bestMetric ? `Rank #${bestMetric.latest!.rank}` : "No ranking available yet"}
          </div>
        </div>
        <div className="rounded-3xl bg-muted p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weakest standing</div>
          <div className="mt-2 text-lg font-semibold">
            {weakestMetric ? weakestMetric.definition.label : "Waiting for data"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {weakestMetric ? `Rank #${weakestMetric.latest!.rank}` : "No ranking available yet"}
          </div>
        </div>
        <div className="rounded-3xl bg-muted p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Top 10 finishes</div>
          <div className="mt-2 text-3xl font-bold">{topTenCount}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Metrics where {profile.jurisdiction.name} is in the national top ten.
          </div>
        </div>
        <div className="rounded-3xl bg-muted p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bottom 10 finishes</div>
          <div className="mt-2 text-3xl font-bold">{bottomTenCount}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Metrics where {profile.jurisdiction.name} is in the bottom ten.
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {profile.metrics.map((metric) => (
          <Card key={metric.definition.id} className="space-y-5">
            <div className="space-y-2">
              <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{metric.definition.category}</div>
              <CardTitle>{metric.definition.label}</CardTitle>
              <CardDescription>{metric.definition.description}</CardDescription>
            </div>
            {metric.latest ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rank</div>
                  <div className="mt-2 text-2xl font-bold">{metric.latest.rank}</div>
                </div>
                <div className="rounded-2xl bg-muted p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest value</div>
                  <div className="mt-2 text-2xl font-bold">
                    {formatMetricValue(metric.definition, metric.latest.value)}
                  </div>
                </div>
                <div className="rounded-2xl bg-muted p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Benchmark</div>
                  <div className="mt-2 text-xl font-bold">
                    {metric.latest.benchmarkValue == null
                      ? "Not published"
                      : formatMetricValue(metric.definition, metric.latest.benchmarkValue)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                No data available for this metric yet.
              </div>
            )}
            {metric.trend.length > 0 ? <TrendChart metric={metric.definition} data={metric.trend} /> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
