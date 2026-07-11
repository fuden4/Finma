import { NextResponse } from "next/server";
import { listPosters } from "@/db/queries";
import { getSession } from "@/lib/session";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await getSession();
    const posters = await listPosters(session.userId);
    return NextResponse.json({ posters });
  } catch (error) {
    return handleRouteError(error);
  }
}
