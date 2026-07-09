import { NextResponse } from "next/server";
import {
  deleteMovieRating,
  findUserById,
  getMovieRatingStats,
  getUserMovieRating,
  upsertMovieRating,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";
import { getSession } from "@/lib/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function buildRatingResponse(movieId: string, userId?: string) {
  const stats = await getMovieRatingStats(movieId);
  const user_rating =
    userId !== undefined ? await getUserMovieRating(userId, movieId) : null;
  return {
    avg_rating: stats.avg_rating,
    rating_count: stats.rating_count,
    user_rating,
  };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    assertUuid(id, "movie id");

    const session = await getSession();
    const userId = session.userId
      ? (await findUserById(session.userId))?.id
      : undefined;

    return NextResponse.json(await buildRatingResponse(id, userId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    assertUuid(id, "movie id");

    const body = await request.json();
    const rating = body?.rating;

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      throw new HttpError(400, "Rating must be an integer between 1 and 5");
    }

    await upsertMovieRating(user.id, id, rating);
    return NextResponse.json(await buildRatingResponse(id, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    assertUuid(id, "movie id");

    await deleteMovieRating(user.id, id);
    return NextResponse.json(await buildRatingResponse(id, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
