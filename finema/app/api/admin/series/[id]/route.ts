import { NextResponse } from "next/server";
import { deleteSeries, getSeriesById, updateSeries } from "@/db/queries";
import {
  parseSeriesFormData,
  resolveSeriesImageUrls,
} from "@/lib/admin-upload";
import { requireAdmin } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    assertUuid(id, "series id");
    const series = await getSeriesById(id);
    if (!series) {
      throw new HttpError(404, "Series not found");
    }
    return NextResponse.json({ series });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    assertUuid(id, "series id");
    const formData = await request.formData();
    const parsed = parseSeriesFormData(formData);

    const { poster_url, backdrop_url } = await resolveSeriesImageUrls(
      parsed,
      parsed.title
    );

    const series = await updateSeries(id, {
      title: parsed.title,
      description: parsed.description,
      release_year: parsed.release_year,
      poster_url,
      backdrop_url,
      match_score: parsed.match_score,
      genres: parsed.genres,
    });

    if (!series) {
      throw new HttpError(404, "Series not found");
    }

    return NextResponse.json({ series });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    assertUuid(id, "series id");
    const deleted = await deleteSeries(id);
    if (!deleted) {
      throw new HttpError(404, "Series not found");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
