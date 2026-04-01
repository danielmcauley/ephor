import { NextResponse } from "next/server";

import { getMetadata } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getMetadata());
}
