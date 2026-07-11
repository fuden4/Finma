import { NextResponse } from "next/server";
import {
  deletePlaylist,
  getPlaylistWithSongs,
  updatePlaylist,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "playlist id");
    const playlist = await getPlaylistWithSongs(id, user.id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    return NextResponse.json({ playlist });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "playlist id");
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      throw new HttpError(400, "Playlist name is required");
    }
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;
    const playlist = await updatePlaylist(id, user.id, {
      name,
      description: description || null,
    });
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    return NextResponse.json({ playlist });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "playlist id");
    const deleted = await deletePlaylist(id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
