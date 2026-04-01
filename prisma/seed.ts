import "dotenv/config";

import { prisma } from "@/lib/db";
import { JURISDICTIONS } from "@/lib/data/jurisdictions";
import { METRIC_CATALOG } from "@/lib/metrics/catalog";

async function main() {
  await prisma.$transaction([
    ...JURISDICTIONS.map((jurisdiction) =>
      prisma.jurisdiction.upsert({
        where: { slug: jurisdiction.slug },
        update: jurisdiction,
        create: jurisdiction
      })
    ),
    ...METRIC_CATALOG.map((metric) =>
      prisma.metricDefinition.upsert({
        where: { id: metric.id },
        update: {
          ...metric
        },
        create: {
          ...metric
        }
      })
    )
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
