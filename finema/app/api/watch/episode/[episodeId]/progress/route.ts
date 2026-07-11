import { NextResponse } from "next/server";
import {
  getEpisodeById,
  getEpisodeWatchProgress,
  saveEpisodeWatchProgress,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    const user = await requireUser();
    const { episodeId } = await params;
    assertUuid(episodeId, "episode id");

    const episode = await getEpisodeById(episodeId);
    if (!episode) {
      throw new HttpError(404, "Episode not found");
    }

    const progress = await getEpisodeWatchProgress(user.id, episodeId);
    return NextResponse.json({ progress });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    const user = await requireUser();
    const { episodeId } = await params;
    assertUuid(episodeId, "episode id");

    const episode = await getEpisodeById(episodeId);
    if (!episode) {
      throw new HttpError(404, "Episode not found");
    }

    const body = await request.json();
    const progressSeconds = body?.progress_seconds;

    if (
      typeof progressSeconds !== "number" ||
      !Number.isInteger(progressSeconds) ||
      progressSeconds < 0
    ) {
      throw new HttpError(400, "progress_seconds must be a non-negative integer");
    }

    const progress = await saveEpisodeWatchProgress(
      user.id,
      episodeId,
      progressSeconds,
      episode.duration_seconds
    );

    return NextResponse.json({ progress });
  } catch (error) {
    return handleRouteError(error);
  }
}
