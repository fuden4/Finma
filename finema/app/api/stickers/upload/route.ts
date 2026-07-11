import { NextResponse } from "next/server";
import { createUserUploadedSticker } from "@/db/queries";
import { requireActiveUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { saveImageFile } from "@/lib/upload";

const MAX_STICKER_BYTES = 2 * 1024 * 1024;
const ALLOWED_STICKER_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const formData = await request.formData();
    const fileEntry = formData.get("sticker_file");
    const labelEntry = formData.get("label");

    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      throw new HttpError(400, "sticker_file is required");
    }

    if (fileEntry.size > MAX_STICKER_BYTES) {
      throw new HttpError(400, "Sticker must be 2 MB or smaller");
    }

    if (!ALLOWED_STICKER_TYPES.has(fileEntry.type)) {
      throw new HttpError(400, "Sticker must be PNG, JPEG, WebP, or GIF");
    }

    const label =
      typeof labelEntry === "string" && labelEntry.trim().length > 0
        ? labelEntry.trim().slice(0, 100)
        : fileEntry.name.replace(/\.[^.]+$/, "").slice(0, 100) || "Uploaded sticker";

    const url = await saveImageFile(fileEntry, {
      directory: `images/user-stickers/${user.id}`,
      filenamePrefix: "sticker",
    });

    const sticker = await createUserUploadedSticker(user.id, url, label);
    return NextResponse.json({ sticker }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
