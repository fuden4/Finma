import { NextResponse } from "next/server";
import { getSongBlockWithSongs } from "@/db/queries";
import { getSession } from "@/lib/session";
import { assertUuid, handleRouteError } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    assertUuid(id, "block id");
    const block = await getSongBlockWithSongs(id, session.userId);
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    return NextResponse.json({ block });
  } catch (error) {
    return handleRouteError(error);
  }
}
