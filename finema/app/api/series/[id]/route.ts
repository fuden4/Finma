import { NextResponse } from "next/server";
import { getSeriesById } from "@/db/queries";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    assertUuid(id, "series id");
    const series = await getSeriesById(id);
    if (!series) {
      throw new HttpError(404, "Series not found");
    }
    return NextResponse.json({ series });
  } catch (error) {
    return handleRouteError(error);
  }
}
