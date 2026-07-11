import { NextResponse } from "next/server";
import { searchGifs } from "@/lib/giphy";
import { requireActiveUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireActiveUser();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const offsetParam = searchParams.get("offset") ?? "0";
    const offset = Number.parseInt(offsetParam, 10);

    if (!Number.isFinite(offset) || offset < 0) {
      throw new HttpError(400, "Invalid offset");
    }

    const gifs = await searchGifs(query, offset);
    return NextResponse.json({ gifs });
  } catch (error) {
    if (error instanceof Error && error.message === "GIPHY_API_KEY is not configured") {
      return NextResponse.json(
        { error: "GIF search is not configured" },
        { status: 503 }
      );
    }
    return handleRouteError(error);
  }
}
