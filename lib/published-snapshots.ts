import type { SourceObservation } from "@/lib/ingest/types";

export type SnapshotCandidate = {
  metricId: string;
  periodKey: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd?: Date | null;
  rowCount: number;
  releaseDate?: Date | null;
  ingestedAt?: Date | null;
};

export type MetricSnapshotSummary<T extends SnapshotCandidate = SnapshotCandidate> = {
  latest: T | null;
  published: T | null;
};

function compareSnapshots(left: SnapshotCandidate, right: SnapshotCandidate) {
  return right.periodStart.getTime() - left.periodStart.getTime();
}

export function selectLatestCompleteSnapshot<T extends SnapshotCandidate>(
  snapshots: T[],
  expectedRowCount: number
) {
  return [...snapshots]
    .sort(compareSnapshots)
    .find((snapshot) => snapshot.rowCount >= expectedRowCount) ?? null;
}

export function summarizeSourceObservations(
  observations: SourceObservation[],
  expectedRowCount: number
) {
  const snapshots = new Map<string, SnapshotCandidate>();

  for (const observation of observations) {
    const key = `${observation.metricId}:${observation.periodKey}`;
    const existing = snapshots.get(key);

    if (existing) {
      existing.rowCount += 1;
      existing.releaseDate =
        existing.releaseDate == null ||
        (observation.releaseDate != null &&
          observation.releaseDate.getTime() > existing.releaseDate.getTime())
          ? observation.releaseDate ?? existing.releaseDate
          : existing.releaseDate;
      continue;
    }

    snapshots.set(key, {
      metricId: observation.metricId,
      periodKey: observation.periodKey,
      periodLabel: observation.periodLabel,
      periodStart: observation.periodStart,
      periodEnd: observation.periodEnd ?? null,
      rowCount: 1,
      releaseDate: observation.releaseDate ?? null
    });
  }

  const summaries = new Map<string, MetricSnapshotSummary>();

  for (const snapshot of snapshots.values()) {
    const current = summaries.get(snapshot.metricId);

    if (!current) {
      summaries.set(snapshot.metricId, {
        latest: snapshot,
        published: null
      });
      continue;
    }

    if (
      current.latest == null ||
      compareSnapshots(snapshot, current.latest) < 0
    ) {
      current.latest = snapshot;
    }
  }

  for (const [metricId, summary] of summaries) {
    const metricSnapshots = [...snapshots.values()].filter(
      (snapshot) => snapshot.metricId === metricId
    );

    summary.published = selectLatestCompleteSnapshot(metricSnapshots, expectedRowCount);
  }

  return summaries;
}
