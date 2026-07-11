import { NextResponse } from "next/server";
import {
  getSongCategoryById,
  listSongsByCategory,
} from "@/db/queries";
import { getSession } from "@/lib/session";
import { assertUuid, handleRouteError } from "@/lib/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    const { id } = await context.params;
    assertUuid(id, "category id");
    const category = await getSongCategoryById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    const songs = await listSongsByCategory(id, session.userId);
    return NextResponse.json({ category, songs });
  } catch (error) {
    return handleRouteError(error);
  }
}
