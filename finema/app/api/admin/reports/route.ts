import { NextResponse } from "next/server";
import { listPendingReports } from "@/db/queries";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const reports = await listPendingReports();
    return NextResponse.json({ reports });
  } catch (error) {
    return handleRouteError(error);
  }
}
