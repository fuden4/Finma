import { NextResponse } from "next/server";
import { listLikedSongBlocks, listLikedSongs } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const [songs, blocks] = await Promise.all([
      listLikedSongs(user.id),
      listLikedSongBlocks(user.id),
    ]);
    return NextResponse.json({ songs, blocks });
  } catch (error) {
    return handleRouteError(error);
  }
}
