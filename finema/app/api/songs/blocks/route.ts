import { NextResponse } from "next/server";
import { listSongBlocks } from "@/db/queries";
import { getSession } from "@/lib/session";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await getSession();
    const blocks = await listSongBlocks(session.userId);
    return NextResponse.json({ blocks });
  } catch (error) {
    return handleRouteError(error);
  }
}
