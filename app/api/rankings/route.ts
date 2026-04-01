import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_METRIC_ID, METRIC_BY_ID } from "@/lib/metrics/catalog";
import { getLatestRanking } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const metric = request.nextUrl.searchParams.get("metric") ?? DEFAULT_METRIC_ID;

  if (!METRIC_BY_ID.has(metric)) {
    return NextResponse.json({ error: "Unknown metric." }, { status: 400 });
  }

  return NextResponse.json(await getLatestRanking(metric));
}
