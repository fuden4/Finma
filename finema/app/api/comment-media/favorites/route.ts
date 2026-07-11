import { NextResponse } from "next/server";
import {
  addUserMediaFavorite,
  removeUserMediaFavorite,
} from "@/db/queries";
import type { CommentMediaType } from "@/db/types";
import { requireActiveUser } from "@/lib/auth";
import { isAllowedGifUrl, validateCommentMedia } from "@/lib/comment-media";
import { handleRouteError, HttpError } from "@/lib/http";

function parseMediaType(value: unknown): CommentMediaType {
  if (value !== "gif" && value !== "sticker") {
    throw new HttpError(400, "Invalid media_type");
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    const mediaType = parseMediaType(body?.media_type);
    const mediaUrl =
      typeof body?.media_url === "string" ? body.media_url.trim() : "";

    if (!mediaUrl) {
      throw new HttpError(400, "media_url is required");
    }

    validateCommentMedia(mediaType, mediaUrl, user.id);

    const previewUrl =
      typeof body?.preview_url === "string" ? body.preview_url.trim() : null;
    const giphyId =
      typeof body?.giphy_id === "string" ? body.giphy_id.trim() : null;
    const label = typeof body?.label === "string" ? body.label.trim() : null;

    if (mediaType === "gif" && previewUrl && !isAllowedGifUrl(previewUrl)) {
      throw new HttpError(400, "Invalid preview URL");
    }

    const favorite = await addUserMediaFavorite(user.id, {
      mediaType,
      mediaUrl,
      previewUrl,
      giphyId,
      label,
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return handleRouteError(new HttpError(400, error.message));
    }
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    const mediaType = parseMediaType(body?.media_type);
    const mediaUrl =
      typeof body?.media_url === "string" ? body.media_url.trim() : "";

    if (!mediaUrl) {
      throw new HttpError(400, "media_url is required");
    }

    await removeUserMediaFavorite(user.id, mediaType, mediaUrl);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
