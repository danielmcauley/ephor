import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export function EmptyState() {
  return (
    <Card className="flex min-h-64 flex-col items-start justify-center gap-4">
      <CardTitle>No metric observations yet</CardTitle>
      <CardDescription>
        Seed the catalog, connect a Postgres database, and run the ingest job to populate the dashboard with official state data.
      </CardDescription>
      <div className="flex flex-wrap gap-3">
        <code className="rounded-full bg-muted px-3 py-2 text-sm">npm run db:seed</code>
        <code className="rounded-full bg-muted px-3 py-2 text-sm">npm run ingest</code>
      </div>
      <Link href="/methodology" className={buttonVariants()}>
        Review methodology
      </Link>
    </Card>
  );
}
