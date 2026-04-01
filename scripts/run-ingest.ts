import "dotenv/config";

import { prisma } from "@/lib/db";
import { runIngest } from "@/lib/ingest";

async function main() {
  const results = await runIngest();
  console.table(results);
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
