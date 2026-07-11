import { NextResponse } from "next/server";
import {
  createSongBlock,
  listAdminSongBlocks,
} from "@/db/queries";
import type { SongBlockLayout } from "@/db/types";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

function parseLayout(value: unknown): SongBlockLayout {
  if (value === "row" || value === "grid") return value;
  return "row";
}

export async function GET() {
  try {
    await requireAdmin();
    const blocks = await listAdminSongBlocks();
    return NextResponse.json({ blocks });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) {
      throw new HttpError(400, "Title is required");
    }
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;
    const layout = parseLayout(body?.layout);
    const sort_order =
      typeof body?.sort_order === "number" ? body.sort_order : 0;
    const song_ids = Array.isArray(body?.song_ids)
      ? body.song_ids.filter((id: unknown): id is string => typeof id === "string")
      : [];

    const block = await createSongBlock({
      title,
      description: description || null,
      layout,
      sort_order,
      song_ids,
    });
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
