import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getMetadata } from "@/lib/data/queries";
import { formatDateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const { metrics, refreshStatus } = await getMetadata();
  const refreshByMetric = new Map(refreshStatus.map((status) => [status.metricId, status]));

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <Badge>Methodology</Badge>
        <CardTitle className="text-3xl">How the dashboard works</CardTitle>
        <CardDescription className="max-w-3xl text-base">
          The MVP ranks states one metric at a time. Each card below lists the source, cadence, directionality, last refresh state, and caveats for that metric.
        </CardDescription>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {metrics.map((metric) => {
          const refresh = refreshByMetric.get(metric.id);

          return (
            <Card key={metric.id} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{metric.category}</div>
                  <CardTitle className="mt-2">{metric.label}</CardTitle>
                </div>
                <Badge className={refresh?.stale ? "bg-accent text-accent-foreground" : ""}>
                  {refresh?.stale ? "Stale" : refresh?.status ?? "Pending"}
                </Badge>
              </div>
              <CardDescription>{metric.description}</CardDescription>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="mt-1 font-semibold">
                    <a href={metric.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4">
                      {metric.sourceName}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cadence</dt>
                  <dd className="mt-1 font-semibold">{metric.cadence}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Directionality</dt>
                  <dd className="mt-1 font-semibold">{metric.betterDirection === "HIGHER" ? "Higher is better" : "Lower is better"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last refresh</dt>
                  <dd className="mt-1 font-semibold">{formatDateLabel(refresh?.completedAt)}</dd>
                </div>
              </dl>
              {metric.caveats ? (
                <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">{metric.caveats}</div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
