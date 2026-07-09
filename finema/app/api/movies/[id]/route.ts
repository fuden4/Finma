import { NextResponse } from "next/server";
import { getMovieById } from "@/db/queries";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "movie id");

    const movie = await getMovieById(id);
    if (!movie) {
      throw new HttpError(404, "Movie not found");
    }

    return NextResponse.json({ movie });
  } catch (error) {
    return handleRouteError(error);
  }
}
