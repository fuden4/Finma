import { NextResponse } from "next/server";
import { searchCatalog } from "@/db/queries";
import { handleRouteError, HttpError } from "@/lib/http";

function parseOptionalInt(value: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalFloat(value: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseType(value: string | null): "all" | "movie" | "series" {
  if (value === "movie" || value === "series") return value;
  return "all";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const type = parseType(searchParams.get("type"));
    const year = parseOptionalInt(searchParams.get("year"));
    const minRating = parseOptionalFloat(searchParams.get("min_rating"));

    if (year !== null && (year < 1900 || year > 2100)) {
      throw new HttpError(400, "Invalid year");
    }

    if (minRating !== null && (minRating < 1 || minRating > 5)) {
      throw new HttpError(400, "min_rating must be between 1 and 5");
    }

    const results = await searchCatalog({
      query,
      type,
      year,
      minRating,
      limit: 20,
    });

    return NextResponse.json({ results });
  } catch (error) {
    return handleRouteError(error);
  }
}
