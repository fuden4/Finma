import { NextResponse } from "next/server";
import {
  deleteEpisode,
  getEpisodeById,
  updateEpisodeWithStream,
} from "@/db/queries";
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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    assertUuid(id, "episode id");

    const existing = await getEpisodeById(id);
    if (!existing) {
      throw new HttpError(404, "Episode not found");
    }

    const formData = await request.formData();
    const season_number = Number(formData.get("season_number"));
    const episode_number = Number(formData.get("episode_number"));
    const title = String(formData.get("episode_title") ?? formData.get("title") ?? "").trim();
    const description =
      String(formData.get("episode_description") ?? formData.get("description") ?? "").trim() ||
      null;
    const quality_label =
      String(formData.get("quality_label") ?? "").trim() || null;

    if (!title) {
      throw new HttpError(400, "Episode title is required");
    }

    const videoEntry = formData.get("video");
    const video =
      videoEntry instanceof File && videoEntry.size > 0 ? videoEntry : null;

    let hls_playlist_url: string | undefined;
    let duration_seconds = existing.duration_seconds;

    if (video) {
      const transcode = await saveAndTranscodeVideo(video, title);
      hls_playlist_url = transcode.hls_playlist_url;
      duration_seconds = transcode.duration_seconds;
    }

    const episode = await updateEpisodeWithStream(id, {
      season_number: Number.isFinite(season_number) ? season_number : existing.season_number,
      episode_number: Number.isFinite(episode_number) ? episode_number : existing.episode_number,
      title,
      description,
      duration_seconds,
      thumbnail_url: existing.thumbnail_url,
      quality_label,
      hls_playlist_url,
    });

    return NextResponse.json({ episode });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    assertUuid(id, "episode id");
    const deleted = await deleteEpisode(id);
    if (!deleted) {
      throw new HttpError(404, "Episode not found");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
