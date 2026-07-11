import { NextResponse } from "next/server";
import { listLikedPosters } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const posters = await listLikedPosters(user.id);
    return NextResponse.json({ posters });
  } catch (error) {
    return handleRouteError(error);
  }
}
