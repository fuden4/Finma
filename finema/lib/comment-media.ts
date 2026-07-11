import type { CommentMediaType } from "@/db/types";
import { isAllowedStickerUrl } from "@/lib/sticker-packs";

const GIPHY_HOSTS = new Set([
  "media.giphy.com",
  "i.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
]);

export interface CommentMediaInput {
  type: CommentMediaType;
  url: string;
}

export function isAllowedGifUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && GIPHY_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function validateCommentMedia(
  mediaType: unknown,
  mediaUrl: unknown,
  userId?: string
): CommentMediaInput | null {
  const hasType = mediaType != null && mediaType !== "";
  const hasUrl = typeof mediaUrl === "string" && mediaUrl.trim().length > 0;

  if (!hasType && !hasUrl) {
    return null;
  }

  if (!hasType || !hasUrl) {
    throw new Error("media_type and media_url must both be provided");
  }

  if (mediaType !== "gif" && mediaType !== "sticker") {
    throw new Error("Invalid media_type");
  }

  const url = mediaUrl.trim();

  if (mediaType === "gif" && !isAllowedGifUrl(url)) {
    throw new Error("Invalid GIF URL");
  }

  if (mediaType === "sticker" && !isAllowedStickerUrl(url, userId)) {
    throw new Error("Invalid sticker URL");
  }

  return { type: mediaType, url };
}

export function validateCommentContent(
  body: string,
  media: CommentMediaInput | null
): void {
  if (body.length > 2000) {
    throw new Error("Comment must be at most 2000 characters");
  }

  if (body.length === 0 && !media) {
    throw new Error("Comment must include text or media");
  }
}
