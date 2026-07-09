import { NextResponse } from "next/server";
import { resolveReport } from "@/db/queries";
import type { ReportResolveAction } from "@/db/types";
import { requireAdmin } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

const VALID_ACTIONS: ReportResolveAction[] = [
  "dismiss",
  "delete_comment",
  "suspend_user",
  "ban_user",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    assertUuid(id, "report id");

    const body = await request.json();
    const action = body?.action as ReportResolveAction;

    if (!VALID_ACTIONS.includes(action)) {
      throw new HttpError(400, "Invalid action");
    }

    const ok = await resolveReport(id, admin.id, action);
    if (!ok) {
      throw new HttpError(404, "Report not found or already resolved");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
