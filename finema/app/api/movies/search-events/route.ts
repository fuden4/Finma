import { NextResponse } from "next/server";
import { recordMovieSearch } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const movieId = typeof body?.movie_id === "string" ? body.movie_id : "";

    if (!movieId) {
      throw new HttpError(400, "movie_id is required");
    }

    assertUuid(movieId, "movie id");
    await recordMovieSearch(user.id, movieId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
