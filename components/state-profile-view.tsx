import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatMetricValue } from "@/lib/metrics/format";
import type { StateProfile } from "@/lib/types";
import { TrendChart } from "@/components/trend-chart";

type StateProfileViewProps = {
  profile: StateProfile;
};

export function StateProfileView({ profile }: StateProfileViewProps) {
  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">State profile</div>
        <CardTitle className="text-4xl">{profile.jurisdiction.name}</CardTitle>
        <CardDescription>
          Latest rank and recent trend for each MVP metric.
        </CardDescription>
      </Card>
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
