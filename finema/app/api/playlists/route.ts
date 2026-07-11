import { NextResponse } from "next/server";
import { createPlaylist, listUserPlaylists } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const playlists = await listUserPlaylists(user.id);
    return NextResponse.json({ playlists });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      throw new HttpError(400, "Playlist name is required");
    }
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;
    const playlist = await createPlaylist(user.id, {
      name,
      description: description || null,
    });
    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
