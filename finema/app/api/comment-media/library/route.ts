import { NextResponse } from "next/server";
import { getCommentMediaLibrary } from "@/db/queries";
import { requireActiveUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const library = await getCommentMediaLibrary(user.id);
    return NextResponse.json({ library });
  } catch (error) {
    return handleRouteError(error);
  }
}
