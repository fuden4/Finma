import { NextResponse } from "next/server";
import { getCommentMediaLibrary } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const library = await getCommentMediaLibrary(user.id);
    return NextResponse.json({ library });
  } catch (error) {
    return handleRouteError(error);
  }
}
