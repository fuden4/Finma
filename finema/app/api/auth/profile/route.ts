import { NextResponse } from "next/server";
import { updateUserAvatar, updateUserDisplayName } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { saveImageFile } from "@/lib/upload";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const displayNameEntry = formData.get("displayName");
    const avatarEntry = formData.get("avatar_file");

    const displayName =
      typeof displayNameEntry === "string" ? displayNameEntry.trim() : "";
    const hasAvatar =
      avatarEntry instanceof File && avatarEntry.size > 0;
    const hasDisplayName = displayName.length > 0;

    if (!hasAvatar && !hasDisplayName) {
      throw new HttpError(400, "displayName or avatar_file is required");
    }

    if (hasDisplayName && displayName.length > 100) {
      throw new HttpError(400, "Display name must be 100 characters or less");
    }

    let updated = user;

    if (hasDisplayName) {
      const withDisplayName = await updateUserDisplayName(user.id, displayName);
      if (!withDisplayName) {
        throw new HttpError(404, "User not found");
      }
      updated = withDisplayName;
    }

    if (hasAvatar) {
      const avatarUrl = await saveImageFile(avatarEntry, {
        directory: "images/avatars",
        filenamePrefix: user.id,
      });

      const withAvatar = await updateUserAvatar(user.id, avatarUrl);
      if (!withAvatar) {
        throw new HttpError(404, "User not found");
      }
      updated = withAvatar;
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
