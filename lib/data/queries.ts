import { MetricCadence, RefreshStatus as PrismaRefreshStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { METRIC_BY_ID, METRIC_CATALOG } from "@/lib/metrics/catalog";
import { rankObservations } from "@/lib/metrics/ranking";
import type { MetricDefinition, MetricObservation, RefreshStatus, StateProfile } from "@/lib/types";

function toNumber(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number.parseFloat(value);
  }

  if (typeof value === "object" && "toNumber" in (value as Record<string, unknown>)) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value);
}

function mapObservation(record: {
  metricId: string;
  periodKey: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date | null;
  value: unknown;
  benchmarkValue: unknown;
  benchmarkLabel: string | null;
  releaseDate: Date | null;
  sourceUrl: string;
  ingestedAt: Date;
  jurisdiction: {
    slug: string;
    name: string;
    abbr: string;
    fips: string;
  };
}): MetricObservation {
  return {
    jurisdiction: record.jurisdiction,
    metricId: record.metricId,
    periodKey: record.periodKey,
    periodLabel: record.periodLabel,
    periodStart: record.periodStart.toISOString(),
    periodEnd: record.periodEnd?.toISOString() ?? null,
    value: toNumber(record.value) ?? 0,
    benchmarkValue: toNumber(record.benchmarkValue),
    benchmarkLabel: record.benchmarkLabel,
    releaseDate: record.releaseDate?.toISOString() ?? null,
    sourceUrl: record.sourceUrl,
    ingestedAt: record.ingestedAt.toISOString()
  };
}

function cadenceWindow(metricId: string) {
  const metric = METRIC_BY_ID.get(metricId);

  switch (metric?.cadence) {
    case "MONTHLY":
      return 60;
    case "QUARTERLY":
      return 20;
    case "ANNUAL":
    default:
      return 5;
  }
}

function staleThreshold(cadence: MetricCadence) {
  const day = 24 * 60 * 60 * 1000;

  switch (cadence) {
    case MetricCadence.MONTHLY:
      return 45 * day;
    case MetricCadence.QUARTERLY:
      return 137 * day;
    case MetricCadence.ANNUAL:
    default:
      return 548 * day;
  }
}

function mapMetricDefinition(record: {
  id: string;
  label: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  cadence: string;
  betterDirection: string;
  unit: string;
  description: string;
  caveats: string | null;
  methodology: string | null;
  defaultMetric: boolean;
}): MetricDefinition {
  return {
    id: record.id,
    label: record.label,
    category: record.category as MetricDefinition["category"],
    sourceName: record.sourceName,
    sourceUrl: record.sourceUrl,
    cadence: record.cadence as MetricDefinition["cadence"],
    betterDirection: record.betterDirection as MetricDefinition["betterDirection"],
    unit: record.unit as MetricDefinition["unit"],
    description: record.description,
    caveats: record.caveats ?? null,
    methodology: record.methodology ?? "",
    defaultMetric: record.defaultMetric
  };
}

export async function getMetadata() {
  const [metrics, refreshRuns, observationGroups] = await Promise.all([
    prisma.metricDefinition.findMany({
      orderBy: [
        { category: "asc" },
        { label: "asc" }
      ]
    }),
    prisma.refreshRun.findMany({
      distinct: ["metricId"],
      orderBy: [
        { metricId: "asc" },
        { startedAt: "desc" }
      ]
    }),
    prisma.metricObservation.groupBy({
      by: ["metricId"],
      _count: {
        _all: true
      },
      _max: {
        releaseDate: true,
        ingestedAt: true
      }
    })
  ]);

  const statusesByMetric = new Map(refreshRuns.map((run) => [run.metricId, run]));
  const observationsByMetric = new Map(
    observationGroups.map((group) => [group.metricId, group])
  );

  return {
    metrics: metrics.map(mapMetricDefinition),
    refreshStatus: METRIC_CATALOG.map((catalogMetric) => {
      const run = statusesByMetric.get(catalogMetric.id);
      const observationGroup = observationsByMetric.get(catalogMetric.id);
      const lastCompletedAt = run?.completedAt ?? observationGroup?._max.ingestedAt ?? null;
      const releaseDate = run?.releaseDate ?? observationGroup?._max.releaseDate ?? null;
      const stale =
        (!run && !observationGroup) ||
        (run && run.status !== PrismaRefreshStatus.SUCCESS) ||
        (lastCompletedAt != null &&
          Date.now() - lastCompletedAt.getTime() >
            staleThreshold(metricCadenceToPrisma(catalogMetric.cadence)));

      return {
        metricId: catalogMetric.id,
        status: run?.status ?? (observationGroup ? "SUCCESS" : "FAILED"),
        startedAt:
          run?.startedAt.toISOString() ??
          observationGroup?._max.ingestedAt?.toISOString() ??
          new Date(0).toISOString(),
        completedAt: lastCompletedAt?.toISOString() ?? null,
        releaseDate: releaseDate?.toISOString() ?? null,
        rowCount: run?.rowCount ?? observationGroup?._count._all ?? 0,
        message:
          run?.message ??
          (observationGroup
            ? `Using latest ingested observations (${observationGroup._count._all} rows).`
            : "No refresh has run yet."),
        stale
      } satisfies RefreshStatus;
    })
  };
}

export async function getLatestRanking(metricId: string) {
  const metric = await prisma.metricDefinition.findUnique({
    where: { id: metricId }
  });

  if (!metric) {
    notFound();
  }

  const latest = await prisma.metricObservation.findFirst({
    where: { metricId },
    orderBy: { periodStart: "desc" }
  });

  if (!latest) {
    return {
      metric: mapMetricDefinition(metric),
      rows: [] as ReturnType<typeof rankObservations>,
      periodLabel: null
    };
  }

  const observations = await prisma.metricObservation.findMany({
    where: {
      metricId,
      periodKey: latest.periodKey
    },
    include: {
      jurisdiction: {
        select: {
          slug: true,
          name: true,
          abbr: true,
          fips: true
        }
      }
    }
  });

  const ranked = rankObservations(observations.map(mapObservation), metric.betterDirection);

  return {
    metric: mapMetricDefinition(metric),
    rows: ranked,
    periodLabel: latest.periodLabel
  };
}

export async function getStateProfile(slug: string): Promise<StateProfile> {
  const jurisdiction = await prisma.jurisdiction.findUnique({
    where: { slug }
  });

  if (!jurisdiction) {
    notFound();
  }

  const definitions = await prisma.metricDefinition.findMany({
    orderBy: [
      { category: "asc" },
      { label: "asc" }
    ]
  });

  const metrics = await Promise.all(
    definitions.map(async (definition) => {
      const ranking = await getLatestRanking(definition.id);
      const latest = ranking.rows.find((row) => row.jurisdiction.slug === slug) ?? null;
      const trend = await prisma.metricObservation.findMany({
        where: {
          metricId: definition.id,
          jurisdictionId: jurisdiction.id
        },
        orderBy: { periodStart: "desc" },
        take: cadenceWindow(definition.id)
      });

      return {
        definition: mapMetricDefinition(definition),
        latest,
        trend: trend
          .map((point) => ({
            periodLabel: point.periodLabel,
            value: toNumber(point.value) ?? 0
          }))
          .reverse()
      };
    })
  );

  return {
    jurisdiction: {
      slug: jurisdiction.slug,
      name: jurisdiction.name,
      abbr: jurisdiction.abbr,
      fips: jurisdiction.fips
    },
    metrics
  };
}

function metricCadenceToPrisma(cadence: "MONTHLY" | "QUARTERLY" | "ANNUAL") {
  switch (cadence) {
    case "MONTHLY":
      return MetricCadence.MONTHLY;
    case "QUARTERLY":
      return MetricCadence.QUARTERLY;
    case "ANNUAL":
    default:
      return MetricCadence.ANNUAL;
  }
}
