import { NextResponse } from "next/server";
import { listSongCategories } from "@/db/queries";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const categories = await listSongCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}
