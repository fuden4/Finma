import { NextResponse } from "next/server";
import {
  deleteMovie,
  getMovieById,
  updateMovieWithStream,
} from "@/db/queries";
import {
  parseMovieFormData,
  resolveImageUrls,
  saveAndTranscodeVideo,
} from "@/lib/admin-upload";
import { requireAdmin } from "@/lib/auth";
import { assertUuid, handleRouteError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "movie id");
    const movie = await getMovieById(id);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    return NextResponse.json({ movie });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "movie id");

    const existing = await getMovieById(id);
    if (!existing) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const parsed = parseMovieFormData(formData);

    let duration_seconds = existing.duration_seconds;
    let hls_playlist_url: string | undefined;

    if (parsed.video) {
      const transcode = await saveAndTranscodeVideo(parsed.video, parsed.title);
      duration_seconds = transcode.duration_seconds;
      hls_playlist_url = transcode.hls_playlist_url;
    }

    const { poster_url, backdrop_url } = await resolveImageUrls(
      parsed,
      parsed.title
    );

    const movie = await updateMovieWithStream(id, {
      title: parsed.title,
      description: parsed.description,
      release_year: parsed.release_year,
      duration_seconds,
      poster_url,
      backdrop_url,
      match_score: parsed.match_score,
      quality_label: parsed.quality_label,
      genres: parsed.genres,
      hls_playlist_url,
    });

    return NextResponse.json({ movie });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "movie id");
    const deleted = await deleteMovie(id);
    if (!deleted) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
