import { NextResponse } from "next/server";
import {
  createSongCategory,
  listSongCategories,
} from "@/db/queries";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { slugifyTitle } from "@/lib/slug";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await listSongCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
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

    const category = await createSongCategory({
      name,
      slug,
      description: description || null,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
