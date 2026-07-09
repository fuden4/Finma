import { NextResponse } from "next/server";
import {
  createUser,
  DuplicateEmailError,
  updateUserAvatar,
} from "@/db/queries";
import { handleRouteError, HttpError } from "@/lib/http";
import { saveSession } from "@/lib/session";
import { saveImageFile } from "@/lib/upload";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const emailEntry = formData.get("email");
    const displayNameEntry = formData.get("displayName");
    const passwordEntry = formData.get("password");
    const avatarEntry = formData.get("avatar_file");

    const email = typeof emailEntry === "string" ? emailEntry.trim() : "";
    const displayName =
      typeof displayNameEntry === "string" ? displayNameEntry.trim() : "";
    const password = typeof passwordEntry === "string" ? passwordEntry : "";

    if (!email || !displayName || !password) {
      throw new HttpError(400, "Email, display name, and password are required");
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new HttpError(400, "Invalid email address");
    }

    if (displayName.length > 100) {
      throw new HttpError(400, "Display name must be 100 characters or less");
    }

    if (password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters");
    }

    let user;
    try {
      user = await createUser(email, password, displayName);
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new HttpError(409, error.message);
      }
      throw error;
    }

    if (avatarEntry instanceof File && avatarEntry.size > 0) {
      const avatarUrl = await saveImageFile(avatarEntry, {
        directory: "images/avatars",
        filenamePrefix: user.id,
      });
      const updated = await updateUserAvatar(user.id, avatarUrl);
      if (updated) {
        user = updated;
      }
    }

    await saveSession(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
