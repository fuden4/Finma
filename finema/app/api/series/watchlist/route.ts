import { NextResponse } from "next/server";
import { getSeriesWatchlist } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await getSeriesWatchlist(user.id);
    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
