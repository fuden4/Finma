import { NextResponse } from "next/server";
import { deleteCommentByIdForUser } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const user = await requireUser();
    const { commentId } = await params;
    assertUuid(commentId, "comment id");

    const deleted = await deleteCommentByIdForUser(commentId, user.id);
    if (!deleted) {
      throw new HttpError(404, "Comment not found");
    }

    return NextResponse.json({ ok: true as const });
  } catch (error) {
    return handleRouteError(error);
  }
}
