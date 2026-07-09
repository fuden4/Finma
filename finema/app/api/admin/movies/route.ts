import { NextResponse } from "next/server";
import { listAdminMovies, createMovieWithStream } from "@/db/queries";
import {
  parseMovieFormData,
  resolveImageUrls,
  saveAndTranscodeVideo,
} from "@/lib/admin-upload";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  try {
    await requireAdmin();
    const movies = await listAdminMovies();
    return NextResponse.json({ movies });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const parsed = parseMovieFormData(formData);

    if (!parsed.video) {
      return NextResponse.json(
        { error: "Video file is required when creating a movie" },
        { status: 400 }
      );
    }

    const transcode = await saveAndTranscodeVideo(parsed.video, parsed.title);
    const { poster_url, backdrop_url } = await resolveImageUrls(
      parsed,
      parsed.title
    );
    const movie = await createMovieWithStream({
      title: parsed.title,
      description: parsed.description,
      release_year: parsed.release_year,
      duration_seconds: transcode.duration_seconds,
      poster_url,
      backdrop_url,
      match_score: parsed.match_score,
      hls_playlist_url: transcode.hls_playlist_url,
      quality_label: parsed.quality_label,
      genres: parsed.genres,
    });

    return NextResponse.json({ movie }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
