import { NextResponse } from "next/server";
import { listGenres } from "@/db/queries";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const genres = await listGenres();
    return NextResponse.json({ genres });
  } catch (error) {
    return handleRouteError(error);
  }
}
