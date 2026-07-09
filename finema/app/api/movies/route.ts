import { NextResponse } from "next/server";
import { listMovies } from "@/db/queries";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const movies = await listMovies();
    return NextResponse.json({ movies });
  } catch (error) {
    return handleRouteError(error);
  }
}
