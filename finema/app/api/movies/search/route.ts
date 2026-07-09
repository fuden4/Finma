import { NextResponse } from "next/server";
import { searchMoviesByTitle } from "@/db/queries";
import { handleRouteError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const movies = await searchMoviesByTitle(q, 10);
    return NextResponse.json({ movies });
  } catch (error) {
    return handleRouteError(error);
  }
}
