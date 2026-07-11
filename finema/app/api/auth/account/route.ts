import { NextResponse } from "next/server";
import { deleteUserById, findUserByCredentials } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError, HttpError } from "@/lib/http";
import { destroySession } from "@/lib/session";

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();

    if (user.role !== "user") {
      throw new HttpError(
        403,
        "Admin accounts cannot be deleted from this page"
      );
    }

    const body = await request.json().catch(() => null);
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    if (!password) {
      throw new HttpError(400, "Password is required to delete your account");
    }

    const verified = await findUserByCredentials(user.email, password);
    if (!verified) {
      throw new HttpError(401, "Incorrect password");
    }

    const deleted = await deleteUserById(user.id);
    if (!deleted) {
      throw new HttpError(500, "Could not delete account");
    }

    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
