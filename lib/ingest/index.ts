import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { beaRealGdpAdapter, beaRppAdapter } from "@/lib/ingest/adapters/bea";
import { blsCesAdapter } from "@/lib/ingest/adapters/bls-ces";
import { blsLausAdapter } from "@/lib/ingest/adapters/bls-laus";
import { censusAcsAdapter } from "@/lib/ingest/adapters/census-acs";
import { censusPopulationAdapter } from "@/lib/ingest/adapters/census-population";
import { censusStateFinanceAdapter } from "@/lib/ingest/adapters/census-state-finance";
import { censusTaxesAdapter } from "@/lib/ingest/adapters/census-taxes";
import { eiaGasolineAdapter } from "@/lib/ingest/adapters/eia-gasoline";
import { hudPitAdapter } from "@/lib/ingest/adapters/hud-pit";
import type { SourceAdapter, SourceObservation } from "@/lib/ingest/types";

const ADAPTERS: SourceAdapter[] = [
  blsLausAdapter,
  blsCesAdapter,
  beaRealGdpAdapter,
  censusPopulationAdapter,
  censusAcsAdapter,
  beaRppAdapter,
  hudPitAdapter,
  censusStateFinanceAdapter,
  censusTaxesAdapter,
  eiaGasolineAdapter
];

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(6));
}

function toJsonMetadata(metadata: SourceObservation["metadata"]) {
  return metadata == null ? Prisma.JsonNull : (metadata as Prisma.InputJsonValue);
}

export async function runIngest() {
  const jurisdictionIds = new Map(
    (
      await prisma.jurisdiction.findMany({
        select: {
          id: true,
          fips: true
        }
      })
    ).map((jurisdiction) => [jurisdiction.fips, jurisdiction.id])
  );

  const results = [];

  for (const adapter of ADAPTERS) {
    const refreshRun = await prisma.refreshRun.create({
      data: {
        metricId: adapter.metricId,
        status: "RUNNING"
      }
    });

    try {
      const observations = await adapter.fetchObservations();
      await upsertObservations(observations, jurisdictionIds);
      const latestReleaseDate = observations
        .map((observation) => observation.releaseDate ?? null)
        .filter(Boolean)
        .sort((left, right) => right!.getTime() - left!.getTime())[0];

      await prisma.refreshRun.update({
        where: { id: refreshRun.id },
        data: {
          status: "SUCCESS",
          rowCount: observations.length,
          completedAt: new Date(),
          releaseDate: latestReleaseDate ?? null,
          sourceUrl: observations[0]?.sourceUrl ?? null,
          message: `Imported ${observations.length} observations.`
        }
      });

      results.push({
        metricId: adapter.metricId,
        status: "SUCCESS",
        count: observations.length
      });
    } catch (error) {
      await prisma.refreshRun.update({
        where: { id: refreshRun.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          message: error instanceof Error ? error.message : "Unknown ingest error."
        }
      });

      results.push({
        metricId: adapter.metricId,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown ingest error."
      });
    }
  }

  return results;
}

async function upsertObservations(
  observations: SourceObservation[],
  jurisdictionIds: Map<string, string>
) {
  for (const observation of observations) {
    const jurisdictionId = jurisdictionIds.get(observation.jurisdictionFips);

    if (!jurisdictionId) {
      continue;
    }

    await prisma.metricObservation.upsert({
      where: {
        metric_observation_identity: {
          jurisdictionId,
          metricId: observation.metricId,
          periodKey: observation.periodKey
        }
      },
      update: {
        periodStart: observation.periodStart,
        periodEnd: observation.periodEnd ?? null,
        periodLabel: observation.periodLabel,
        value: toDecimal(observation.value),
        benchmarkValue:
          observation.benchmarkValue == null ? null : toDecimal(observation.benchmarkValue),
        benchmarkLabel: observation.benchmarkLabel ?? null,
        releaseDate: observation.releaseDate ?? null,
        sourceUrl: observation.sourceUrl,
        metadata: toJsonMetadata(observation.metadata),
        ingestedAt: new Date()
      },
      create: {
        jurisdictionId,
        metricId: observation.metricId,
        periodKey: observation.periodKey,
        periodStart: observation.periodStart,
        periodEnd: observation.periodEnd ?? null,
        periodLabel: observation.periodLabel,
        value: toDecimal(observation.value),
        benchmarkValue:
          observation.benchmarkValue == null ? null : toDecimal(observation.benchmarkValue),
        benchmarkLabel: observation.benchmarkLabel ?? null,
        releaseDate: observation.releaseDate ?? null,
        sourceUrl: observation.sourceUrl,
        metadata: toJsonMetadata(observation.metadata)
      }
    });
  }
}
