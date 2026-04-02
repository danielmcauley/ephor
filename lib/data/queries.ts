import { MetricCadence, RefreshStatus as PrismaRefreshStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { JURISDICTIONS } from "@/lib/data/jurisdictions";
import { prisma } from "@/lib/db";
import { DEFAULT_METRIC_ID, METRIC_BY_ID, METRIC_CATALOG } from "@/lib/metrics/catalog";
import { rankObservations } from "@/lib/metrics/ranking";
import { selectLatestCompleteSnapshot, type SnapshotCandidate } from "@/lib/published-snapshots";
import type {
  MetricDefinition,
  MetricObservation,
  RefreshStatus,
  StateProfile,
  StateStackupSummary
} from "@/lib/types";

const PUBLISHED_ROW_COUNT = JURISDICTIONS.length;

type ObservationSnapshotRecord = {
  metricId: string;
  periodKey: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date | null;
  _count: {
    _all: number;
  };
  _max: {
    releaseDate: Date | null;
    ingestedAt: Date | null;
  };
};

type ObservationSnapshot = SnapshotCandidate & {
  ingestedAt?: Date | null;
};

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
    defaultMetric: record.id === DEFAULT_METRIC_ID
  };
}

function mapObservationSnapshot(record: ObservationSnapshotRecord): ObservationSnapshot {
  return {
    metricId: record.metricId,
    periodKey: record.periodKey,
    periodLabel: record.periodLabel,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    rowCount: record._count._all,
    releaseDate: record._max.releaseDate ?? null,
    ingestedAt: record._max.ingestedAt ?? null
  };
}

function completeSnapshots(snapshots: ObservationSnapshot[]) {
  return snapshots.filter((snapshot) => snapshot.rowCount >= PUBLISHED_ROW_COUNT);
}

async function listObservationSnapshots(metricIds?: string[]) {
  const groups = await prisma.metricObservation.groupBy({
    by: ["metricId", "periodKey", "periodLabel", "periodStart", "periodEnd"],
    where: metricIds ? { metricId: { in: metricIds } } : undefined,
    _count: {
      _all: true
    },
    _max: {
      releaseDate: true,
      ingestedAt: true
    }
  });

  const snapshotsByMetric = new Map<string, ObservationSnapshot[]>();

  for (const group of groups as ObservationSnapshotRecord[]) {
    const snapshot = mapObservationSnapshot(group);
    const current = snapshotsByMetric.get(snapshot.metricId) ?? [];
    current.push(snapshot);
    current.sort((left, right) => right.periodStart.getTime() - left.periodStart.getTime());
    snapshotsByMetric.set(snapshot.metricId, current);
  }

  return snapshotsByMetric;
}

async function getPublishedSnapshot(metricId: string) {
  const snapshotsByMetric = await listObservationSnapshots([metricId]);
  const snapshots = snapshotsByMetric.get(metricId) ?? [];

  return selectLatestCompleteSnapshot(snapshots, PUBLISHED_ROW_COUNT);
}

async function getRankedRowsForPeriod(metricId: string, periodKey: string, betterDirection: string) {
  const observations = await prisma.metricObservation.findMany({
    where: {
      metricId,
      periodKey
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

  return rankObservations(
    observations.map(mapObservation),
    betterDirection as MetricDefinition["betterDirection"]
  );
}

export async function getMetadata() {
  const [metrics, refreshRuns, observationSnapshots] = await Promise.all([
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
    listObservationSnapshots()
  ]);
  const mappedMetrics = metrics
    .map(mapMetricDefinition)
    .sort((left, right) => Number(right.defaultMetric) - Number(left.defaultMetric));

  const statusesByMetric = new Map(refreshRuns.map((run) => [run.metricId, run]));

  return {
    metrics: mappedMetrics,
    refreshStatus: METRIC_CATALOG.map((catalogMetric) => {
      const run = statusesByMetric.get(catalogMetric.id);
      const snapshots = observationSnapshots.get(catalogMetric.id) ?? [];
      const publishedSnapshot = selectLatestCompleteSnapshot(snapshots, PUBLISHED_ROW_COUNT);
      const lastCompletedAt = publishedSnapshot?.ingestedAt ?? null;
      const releaseDate = publishedSnapshot?.releaseDate ?? null;
      const stale =
        publishedSnapshot == null ||
        (lastCompletedAt != null &&
          Date.now() - lastCompletedAt.getTime() >
            staleThreshold(metricCadenceToPrisma(catalogMetric.cadence)));

      return {
        metricId: catalogMetric.id,
        status: publishedSnapshot ? PrismaRefreshStatus.SUCCESS : run?.status ?? PrismaRefreshStatus.FAILED,
        startedAt:
          publishedSnapshot?.ingestedAt?.toISOString() ??
          run?.startedAt.toISOString() ??
          new Date(0).toISOString(),
        completedAt: lastCompletedAt?.toISOString() ?? null,
        releaseDate: releaseDate?.toISOString() ?? null,
        rowCount: publishedSnapshot?.rowCount ?? 0,
        message:
          run?.message ??
          (publishedSnapshot
            ? `Serving published snapshot ${publishedSnapshot.periodLabel} (${publishedSnapshot.rowCount}/${PUBLISHED_ROW_COUNT} rows).`
            : "No published snapshot yet."),
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

  const latest = await getPublishedSnapshot(metricId);

  if (!latest) {
    return {
      metric: mapMetricDefinition(metric),
      rows: [] as ReturnType<typeof rankObservations>,
      periodLabel: null
    };
  }

  const ranked = await getRankedRowsForPeriod(metricId, latest.periodKey, metric.betterDirection);

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
  const snapshotsByMetric = await listObservationSnapshots(definitions.map((definition) => definition.id));

  const metrics = await Promise.all(
    definitions.map(async (definition) => {
      const snapshots = snapshotsByMetric.get(definition.id) ?? [];
      const latestSnapshot = selectLatestCompleteSnapshot(snapshots, PUBLISHED_ROW_COUNT);
      const rankingRows = latestSnapshot
        ? await getRankedRowsForPeriod(
            definition.id,
            latestSnapshot.periodKey,
            definition.betterDirection
          )
        : [];
      const trendPeriods = completeSnapshots(snapshots)
        .slice(0, cadenceWindow(definition.id))
        .map((snapshot) => snapshot.periodKey);
      const latest = rankingRows.find((row) => row.jurisdiction.slug === slug) ?? null;
      const trend = trendPeriods.length
        ? await prisma.metricObservation.findMany({
            where: {
              metricId: definition.id,
              jurisdictionId: jurisdiction.id,
              periodKey: {
                in: trendPeriods
              }
            },
            orderBy: { periodStart: "desc" }
          })
        : [];

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

export async function getStateStackupSummaries(): Promise<StateStackupSummary[]> {
  const definitions = await prisma.metricDefinition.findMany({
    orderBy: [
      { category: "asc" },
      { label: "asc" }
    ]
  });

  const rankings = await Promise.all(
    definitions.map(async (definition) => {
      const ranking = await getLatestRanking(definition.id);

      return {
        metricId: definition.id,
        metricLabel: definition.label,
        rows: ranking.rows
      };
    })
  );

  const entriesByJurisdiction = new Map<
    string,
    {
      jurisdiction: StateStackupSummary["jurisdiction"];
      items: Array<{ metricId: string; metricLabel: string; rank: number }>;
    }
  >();

  for (const ranking of rankings) {
    for (const row of ranking.rows) {
      const current = entriesByJurisdiction.get(row.jurisdiction.slug) ?? {
        jurisdiction: row.jurisdiction,
        items: []
      };

      current.items.push({
        metricId: ranking.metricId,
        metricLabel: ranking.metricLabel,
        rank: row.rank
      });

      entriesByJurisdiction.set(row.jurisdiction.slug, current);
    }
  }

  return [...entriesByJurisdiction.values()]
    .map((entry) => {
      const best = [...entry.items]
        .sort((left, right) => left.rank - right.rank || left.metricLabel.localeCompare(right.metricLabel))
        .slice(0, 3);
      const worst = [...entry.items]
        .sort((left, right) => right.rank - left.rank || left.metricLabel.localeCompare(right.metricLabel))
        .slice(0, 3);

      return {
        jurisdiction: entry.jurisdiction,
        best,
        worst
      };
    })
    .sort((left, right) => left.jurisdiction.name.localeCompare(right.jurisdiction.name));
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
