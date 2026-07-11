import { NextResponse } from "next/server";
import { getRecommendationsForUser } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const recommendations = await getRecommendationsForUser(user.id);
    return NextResponse.json(recommendations);
  } catch (error) {
    return handleRouteError(error);
  }
}
