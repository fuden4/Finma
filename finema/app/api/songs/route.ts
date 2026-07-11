import { NextResponse } from "next/server";
import { listSongs } from "@/db/queries";
import { getSession } from "@/lib/session";
import { handleRouteError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id") ?? undefined;
    const query = searchParams.get("q") ?? undefined;
    const songs = await listSongs(session.userId, { categoryId, query });
    return NextResponse.json({ songs });
  } catch (error) {
    return handleRouteError(error);
  }
}
