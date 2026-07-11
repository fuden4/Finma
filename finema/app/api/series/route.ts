import { NextResponse } from "next/server";
import { listSeries } from "@/db/queries";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const series = await listSeries();
    return NextResponse.json({ series });
  } catch (error) {
    return handleRouteError(error);
  }
}
