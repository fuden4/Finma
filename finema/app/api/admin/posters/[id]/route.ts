import { NextResponse } from "next/server";
import {
  deletePoster,
  getPosterById,
  updatePoster,
} from "@/db/queries";
import {
  parsePosterFormData,
  resolvePosterImageUrl,
} from "@/lib/admin-upload";
import { requireAdmin } from "@/lib/auth";
import { assertUuid, handleRouteError } from "@/lib/http";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "poster id");
    const poster = await getPosterById(id);
    if (!poster) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }
    return NextResponse.json({ poster });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "poster id");

    const existing = await getPosterById(id);
    if (!existing) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const parsed = parsePosterFormData(formData);

    let image_url = existing.image_url;
    if (parsed.image_file) {
      image_url = await resolvePosterImageUrl(parsed, parsed.title);
    } else if (parsed.image_url) {
      image_url = parsed.image_url;
    }

    const poster = await updatePoster(id, {
      title: parsed.title,
      description: parsed.description,
      image_url,
    });

    if (!poster) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    return NextResponse.json({ poster });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "poster id");
    const deleted = await deletePoster(id);
    if (!deleted) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
