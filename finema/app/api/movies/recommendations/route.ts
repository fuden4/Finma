import { NextResponse } from "next/server";
import { getRecommendationsForUser } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const movies = await getRecommendationsForUser(user.id);
    return NextResponse.json({ movies });
  } catch (error) {
    return handleRouteError(error);
  }
}
