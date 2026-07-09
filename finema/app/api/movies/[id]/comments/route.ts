import { NextResponse } from "next/server";
import { createComment, listCommentsByMovieId } from "@/db/queries";
import { requireActiveUser } from "@/lib/auth";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "movie id");

    const comments = await listCommentsByMovieId(id);
    return NextResponse.json({ comments });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    assertUuid(id, "movie id");

    const body = await request.json();
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    const parentId =
      typeof body?.parent_id === "string" ? body.parent_id : null;

    if (text.length < 1 || text.length > 2000) {
      throw new HttpError(400, "Comment must be between 1 and 2000 characters");
    }

    if (parentId) {
      assertUuid(parentId, "parent id");
    }

    const comment = await createComment(id, user.id, text, parentId);
    if (!comment) {
      throw new HttpError(404, "Movie or parent comment not found");
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
