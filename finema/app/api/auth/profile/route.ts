import { NextResponse } from "next/server";
import { updateUserAvatar } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { saveImageFile } from "@/lib/upload";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const avatarEntry = formData.get("avatar_file");

    if (!(avatarEntry instanceof File) || avatarEntry.size === 0) {
      throw new HttpError(400, "avatar_file is required");
    }

    const avatarUrl = await saveImageFile(avatarEntry, {
      directory: "images/avatars",
      filenamePrefix: user.id,
    });

    const updated = await updateUserAvatar(user.id, avatarUrl);
    if (!updated) {
      throw new HttpError(404, "User not found");
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
