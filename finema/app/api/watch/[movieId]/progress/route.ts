import { NextResponse } from "next/server";
import { getMovieById, getWatchProgress, upsertWatchProgress } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const user = await requireUser();
    const { movieId } = await params;
    assertUuid(movieId, "movie id");

    const movie = await getMovieById(movieId);
    if (!movie) {
      throw new HttpError(404, "Movie not found");
    }

    const progress = await getWatchProgress(user.id, movieId);
    return NextResponse.json({ progress });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const user = await requireUser();
    const { movieId } = await params;
    assertUuid(movieId, "movie id");

    const movie = await getMovieById(movieId);
    if (!movie) {
      throw new HttpError(404, "Movie not found");
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

    const progress = await upsertWatchProgress(
      user.id,
      movieId,
      progressSeconds
    );
    if (!progress) {
      throw new HttpError(404, "Movie not found");
    }

    return NextResponse.json({ progress });
  } catch (error) {
    return handleRouteError(error);
  }
}
