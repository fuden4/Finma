import { NextResponse } from "next/server";
import { createEpisodeWithStream, getSeriesById } from "@/db/queries";
import {
  parseEpisodeFormData,
  saveAndTranscodeVideo,
} from "@/lib/admin-upload";
import { requireAdmin } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 600;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    assertUuid(id, "series id");

    const existing = await getSeriesById(id);
    if (!existing) {
      throw new HttpError(404, "Series not found");
    }

    const formData = await request.formData();
    const parsed = parseEpisodeFormData(formData);
    const transcode = await saveAndTranscodeVideo(parsed.video!, parsed.title);

    const episode = await createEpisodeWithStream({
      series_id: id,
      season_number: parsed.season_number,
      episode_number: parsed.episode_number,
      title: parsed.title,
      description: parsed.description,
      duration_seconds: transcode.duration_seconds,
      thumbnail_url: existing.poster_url,
      hls_playlist_url: transcode.hls_playlist_url,
      quality_label: parsed.quality_label,
    });

    return NextResponse.json({ episode }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
