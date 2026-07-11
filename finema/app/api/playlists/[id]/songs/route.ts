import { NextResponse } from "next/server";
import {
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "playlist id");
    const body = await request.json();
    const songId = typeof body?.song_id === "string" ? body.song_id.trim() : "";
    if (!songId) {
      throw new HttpError(400, "song_id is required");
    }
    assertUuid(songId, "song id");
    const ok = await addSongToPlaylist(id, user.id, songId);
    if (!ok) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "playlist id");
    const body = await request.json();
    const songId = typeof body?.song_id === "string" ? body.song_id.trim() : "";
    if (!songId) {
      throw new HttpError(400, "song_id is required");
    }
    assertUuid(songId, "song id");
    const ok = await removeSongFromPlaylist(id, user.id, songId);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
