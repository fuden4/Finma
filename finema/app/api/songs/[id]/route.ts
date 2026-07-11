import { NextResponse } from "next/server";
import { getSongById } from "@/db/queries";
import { getSession } from "@/lib/session";
import { assertUuid, handleRouteError } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    assertUuid(id, "song id");
    const song = await getSongById(id, session.userId);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }
    return NextResponse.json({ song });
  } catch (error) {
    return handleRouteError(error);
  }
}
