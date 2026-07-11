import { NextResponse } from "next/server";
import {
  deleteSongBlock,
  updateSongBlock,
} from "@/db/queries";
import type { SongBlockLayout } from "@/db/types";
import { requireAdmin } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseLayout(value: unknown): SongBlockLayout {
  if (value === "row" || value === "grid") return value;
  return "row";
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "block id");
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

    const block = await updateSongBlock(id, {
      title,
      description: description || null,
      layout,
      sort_order,
      song_ids,
    });
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    return NextResponse.json({ block });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "block id");
    const deleted = await deleteSongBlock(id);
    if (!deleted) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
