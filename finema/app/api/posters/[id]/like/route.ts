import { NextResponse } from "next/server";
import {
  likePoster,
  posterExists,
  unlikePoster,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "poster id");

    if (!(await posterExists(id))) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    const result = await likePoster(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "poster id");

    if (!(await posterExists(id))) {
      return NextResponse.json({ error: "Poster not found" }, { status: 404 });
    }

    const result = await unlikePoster(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
