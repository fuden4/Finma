import { NextResponse } from "next/server";
import { getEpisodeWatchHistory } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await getEpisodeWatchHistory(user.id);
    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
