import { NextResponse } from "next/server";
import {
  createCommentReport,
  DuplicateReportError,
  SelfReportError,
} from "@/db/queries";
import { requireActiveUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { commentId } = await params;
    assertUuid(commentId, "comment id");

    const body = await request.json();
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (reason.length < 1 || reason.length > 1000) {
      throw new HttpError(400, "Reason must be between 1 and 1000 characters");
    }

    try {
      const report = await createCommentReport(commentId, user.id, reason);
      return NextResponse.json({ report }, { status: 201 });
    } catch (error) {
      if (error instanceof DuplicateReportError) {
        throw new HttpError(409, error.message);
      }
      if (error instanceof SelfReportError) {
        throw new HttpError(400, error.message);
      }
      if (error instanceof Error && error.message === "Comment not found") {
        throw new HttpError(404, "Comment not found");
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
