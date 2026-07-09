import { NextResponse } from "next/server";
import { findUserByCredentials } from "@/db/queries";
import { handleRouteError, HttpError } from "@/lib/http";
import { saveSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      throw new HttpError(400, "Email and password are required");
    }

    const user = await findUserByCredentials(email, password);
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    if (user.account_status === "suspended") {
      throw new HttpError(403, "Account suspended");
    }

    await saveSession(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
