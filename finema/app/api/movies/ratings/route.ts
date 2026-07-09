import { NextResponse } from "next/server";
import { getRatedMovies } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await getRatedMovies(user.id);
    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
