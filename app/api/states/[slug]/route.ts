import { NextResponse } from "next/server";

import { getStateProfile } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { slug } = await params;

  return NextResponse.json(await getStateProfile(slug));
}
