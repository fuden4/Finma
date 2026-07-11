import { NextResponse } from "next/server";
import {
  deleteSongCategory,
  updateSongCategory,
} from "@/db/queries";
import { requireAdmin } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";
import { slugifyTitle } from "@/lib/slug";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "category id");
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      throw new HttpError(400, "Name is required");
    }
    const slug =
      typeof body?.slug === "string" && body.slug.trim()
        ? body.slug.trim()
        : slugifyTitle(name);
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;

    const category = await updateSongCategory(id, {
      name,
      slug,
      description: description || null,
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "category id");
    const deleted = await deleteSongCategory(id);
    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
