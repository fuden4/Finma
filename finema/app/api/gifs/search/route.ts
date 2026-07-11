import { NextResponse } from "next/server";
import { GiphyConfigError, GiphyRequestError, searchGifs } from "@/lib/giphy";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireUser();

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
    if (error instanceof GiphyConfigError) {
      return NextResponse.json(
        {
          error:
            "GIF search is not configured. Add GIPHY_API_KEY to .env.local on the server.",
        },
        { status: 503 }
      );
    }
    if (error instanceof GiphyRequestError) {
      const status = error.status === 401 || error.status === 403 ? 503 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return handleRouteError(error);
  }
}
