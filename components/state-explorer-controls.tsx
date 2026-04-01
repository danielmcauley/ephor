"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type StateExplorerControlsProps = {
  jurisdictions: Array<{
    slug: string;
    name: string;
    abbr: string;
  }>;
  selectedSlug: string;
};

export function StateExplorerControls({
  jurisdictions,
  selectedSlug
}: StateExplorerControlsProps) {
  const router = useRouter();
  const [value, setValue] = useState(selectedSlug);
  const selectedJurisdiction =
    jurisdictions.find((jurisdiction) => jurisdiction.slug === value) ?? jurisdictions[0];

  function handleChange(nextSlug: string) {
    setValue(nextSlug);

    startTransition(() => {
      router.replace(`/states?state=${nextSlug}`, { scroll: false });
    });
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-3">
        <Badge>State Explorer</Badge>
        <CardTitle className="text-3xl">Pick a state and see where it stacks up.</CardTitle>
        <CardDescription className="max-w-3xl text-base">
          Use the explorer to jump to any state, scan its strongest and weakest rankings, and then dig into the latest metric cards and trends below.
        </CardDescription>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label
          className="flex max-w-md flex-1 flex-col gap-2 text-sm font-medium text-muted-foreground"
          htmlFor="state-explorer-select"
        >
          State
          <select
            id="state-explorer-select"
            className="h-12 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none ring-0"
            value={value}
            onChange={(event) => handleChange(event.target.value)}
          >
            {jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction.slug} value={jurisdiction.slug}>
                {jurisdiction.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current pick</div>
            <div className="mt-1 font-semibold">
              {selectedJurisdiction?.name} {selectedJurisdiction ? `(${selectedJurisdiction.abbr})` : null}
            </div>
          </div>
          <Link
            href={`/states/${value}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Open shareable page
          </Link>
        </div>
      </div>
    </Card>
  );
}
