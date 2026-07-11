import { NextResponse } from "next/server";
import { createEpisodeWithStream, createSeries, getSeriesById, listAdminSeries } from "@/db/queries";
import {
  parseSeriesFormData,
  resolveSeriesImageUrls,
  saveAndTranscodeVideo,
} from "@/lib/admin-upload";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { slugifyTitle } from "@/lib/slug";

export const runtime = "nodejs";
export const maxDuration = 600;

export async function GET() {
  try {
    await requireAdmin();
    const series = await listAdminSeries();
    return NextResponse.json({ series });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const parsed = parseSeriesFormData(formData);

    const { poster_url, backdrop_url } = await resolveSeriesImageUrls(
      parsed,
      parsed.title
    );

    const series = await createSeries({
      title: parsed.title,
      description: parsed.description,
      release_year: parsed.release_year,
      poster_url,
      backdrop_url,
      match_score: parsed.match_score,
      genres: parsed.genres,
    });

    if (parsed.video) {
      const episodeTitle =
        parsed.episode_title ?? `${parsed.title} - S${parsed.season_number}E${parsed.episode_number}`;
      const outputSlug = [
        slugifyTitle(parsed.title) || "series",
        `s${parsed.season_number}e${parsed.episode_number}`,
        slugifyTitle(episodeTitle) || "episode",
      ].join("-");
      const transcode = await saveAndTranscodeVideo(
        parsed.video,
        episodeTitle,
        outputSlug
      );
      await createEpisodeWithStream({
        series_id: series.id,
        season_number: parsed.season_number,
        episode_number: parsed.episode_number,
        title: episodeTitle,
        description: parsed.episode_description,
        duration_seconds: transcode.duration_seconds,
        thumbnail_url: poster_url,
        hls_playlist_url: transcode.hls_playlist_url,
        quality_label: parsed.quality_label,
      });
    }

    const full = await getSeriesById(series.id);
    return NextResponse.json({ series: full ?? series }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
