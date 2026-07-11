import { NextResponse } from "next/server";
import {
  addSeriesToWatchlist,
  isSeriesInWatchlist,
  removeSeriesFromWatchlist,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError } from "@/lib/http";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    assertUuid(id, "series id");
    const inWatchlist = await isSeriesInWatchlist(user.id, id);
    return NextResponse.json({ inWatchlist });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    assertUuid(id, "series id");
    await addSeriesToWatchlist(user.id, id);
    return NextResponse.json({ inWatchlist: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    assertUuid(id, "series id");
    await removeSeriesFromWatchlist(user.id, id);
    return NextResponse.json({ inWatchlist: false });
  } catch (error) {
    return handleRouteError(error);
  }
}
