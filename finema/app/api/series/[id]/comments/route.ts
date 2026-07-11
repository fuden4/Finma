import { NextResponse } from "next/server";
import {
  createSeriesComment,
  listCommentsBySeriesId,
  recordUserMediaRecent,
} from "@/db/queries";
import { requireActiveUser } from "@/lib/auth";
import {
  validateCommentContent,
  validateCommentMedia,
} from "@/lib/comment-media";
import { assertUuid, handleRouteError, HttpError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "series id");

    const comments = await listCommentsBySeriesId(id);
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
    assertUuid(id, "series id");

    const body = await request.json();
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    const parentId =
      typeof body?.parent_id === "string" ? body.parent_id : null;

    let media;
    try {
      media = validateCommentMedia(body?.media_type, body?.media_url, user.id);
      validateCommentContent(text, media);
    } catch (err) {
      throw new HttpError(
        400,
        err instanceof Error ? err.message : "Invalid comment media"
      );
    }

    if (parentId) {
      assertUuid(parentId, "parent id");
    }

    const comment = await createSeriesComment(id, user.id, text, parentId, media);
    if (!comment) {
      throw new HttpError(404, "Series or parent comment not found");
    }

    if (media) {
      const previewUrl =
        typeof body?.media_preview_url === "string"
          ? body.media_preview_url.trim()
          : null;
      const giphyId =
        typeof body?.media_giphy_id === "string"
          ? body.media_giphy_id.trim()
          : null;
      const label =
        typeof body?.media_label === "string" ? body.media_label.trim() : null;

      await recordUserMediaRecent(user.id, {
        mediaType: media.type,
        mediaUrl: media.url,
        previewUrl:
          media.type === "gif" ? previewUrl ?? media.url : previewUrl,
        giphyId: media.type === "gif" ? giphyId : null,
        label: media.type === "sticker" ? label : null,
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
