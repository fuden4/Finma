import { NextResponse } from "next/server";
import {
  likeSongBlock,
  songBlockExists,
  unlikeSongBlock,
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
    assertUuid(id, "block id");
    if (!(await songBlockExists(id))) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    const result = await likeSongBlock(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    assertUuid(id, "block id");
    if (!(await songBlockExists(id))) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    const result = await unlikeSongBlock(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
