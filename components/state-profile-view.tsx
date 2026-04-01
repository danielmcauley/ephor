import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatMetricValue } from "@/lib/metrics/format";
import type { StateProfile } from "@/lib/types";
import { TrendChart } from "@/components/trend-chart";

const STATE_PAGE_PRIORITY_METRIC_IDS = [
  "taxes_per_capita",
  "poverty_rate",
  "cost_of_living_index",
  "unemployment_rate",
  "gasoline_cost"
] as const;

type StateProfileViewProps = {
  profile: StateProfile;
  showHeading?: boolean;
};

type DisplayMetric = StateProfile["metrics"][number];

function StateMetricCard({ metric }: { metric: DisplayMetric }) {
  const isTopTen = metric.latest?.rank != null && metric.latest.rank <= 10;
  const isBottomTen = metric.latest?.rank != null && metric.latest.rank >= 42;

  return (
    <Card className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{metric.definition.category}</Badge>
          <Badge className="bg-white text-foreground ring-1 ring-border">
            {metric.definition.cadence.toLowerCase()}
          </Badge>
          <Badge className="bg-white text-foreground ring-1 ring-border">
            {metric.definition.betterDirection === "HIGHER" ? "Higher is better" : "Lower is better"}
          </Badge>
          {isTopTen ? (
            <Badge className="bg-[rgba(79,180,181,0.18)] text-foreground ring-1 ring-teal-200">
              Top 10
            </Badge>
          ) : null}
          {isBottomTen ? (
            <Badge className="bg-[rgba(246,217,154,0.35)] text-foreground ring-1 ring-amber-200">
              Bottom 10
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2">
          <CardTitle>{metric.definition.label}</CardTitle>
          <CardDescription>{metric.definition.description}</CardDescription>
        </div>
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
  );
}

export function StateProfileView({
  profile,
  showHeading = true
}: StateProfileViewProps) {
  const rankedMetrics = profile.metrics.filter((metric) => metric.latest != null);
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
  const metricsById = new Map(profile.metrics.map((metric) => [metric.definition.id, metric]));
  const prioritizedMetrics = STATE_PAGE_PRIORITY_METRIC_IDS
    .map((metricId) => metricsById.get(metricId))
    .filter((metric): metric is DisplayMetric => Boolean(metric));
  const prioritizedMetricIds = new Set(
    prioritizedMetrics.map((metric) => metric.definition.id)
  );
  const remainingMetrics = profile.metrics.filter(
    (metric) => !prioritizedMetricIds.has(metric.definition.id)
  );

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

      <nav className="sticky top-24 z-20 flex flex-wrap gap-2 rounded-3xl border border-border/70 bg-white/90 p-3 shadow-[0_12px_32px_rgba(18,45,55,0.08)] backdrop-blur">
        <a href="#state-snapshot" className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground">
          Snapshot
        </a>
        <a href="#priority-metrics" className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground">
          Priority metrics
        </a>
        <a href="#all-metrics" className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground">
          Full metric grid
        </a>
      </nav>

      <div id="state-snapshot" className="grid gap-4 scroll-mt-32 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-teal-200 bg-[rgba(79,180,181,0.12)] p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Best standing</div>
          <div className="mt-2 text-lg font-semibold">
            {bestMetric ? bestMetric.definition.label : "Waiting for data"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {bestMetric ? `Rank #${bestMetric.latest!.rank}` : "No ranking available yet"}
          </div>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-[rgba(246,217,154,0.32)] p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weakest standing</div>
          <div className="mt-2 text-lg font-semibold">
            {weakestMetric ? weakestMetric.definition.label : "Waiting for data"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {weakestMetric ? `Rank #${weakestMetric.latest!.rank}` : "No ranking available yet"}
          </div>
        </div>
        <div className="rounded-3xl border border-teal-200 bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Top 10 finishes</div>
          <div className="mt-2 text-3xl font-bold">{topTenCount}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Metrics where {profile.jurisdiction.name} is in the national top ten.
          </div>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bottom 10 finishes</div>
          <div className="mt-2 text-3xl font-bold">{bottomTenCount}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Metrics where {profile.jurisdiction.name} is in the bottom ten.
          </div>
        </div>
      </div>

      <section id="priority-metrics" className="scroll-mt-32 space-y-4">
        <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-3">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Priority metrics</div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Cost pressure and household strain</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            Taxes, poverty, cost of living, unemployment, and gasoline cost.
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {prioritizedMetrics.map((metric) => (
            <StateMetricCard key={metric.definition.id} metric={metric} />
          ))}
        </div>
      </section>

      {remainingMetrics.length > 0 ? (
        <section id="all-metrics" className="scroll-mt-32 space-y-4">
          <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-3">
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Full metric grid</div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Everything else in one place</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              Economy, growth, and remaining household indicators.
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {remainingMetrics.map((metric) => (
              <StateMetricCard key={metric.definition.id} metric={metric} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
