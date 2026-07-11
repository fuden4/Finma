import { NextResponse } from "next/server";
import { likeSong, songExists, unlikeSong } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "song id");
    if (!(await songExists(id))) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }
    const result = await likeSong(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "song id");
    if (!(await songExists(id))) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }
    const result = await unlikeSong(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
