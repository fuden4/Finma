import { findUserById } from "@/db/queries";
import type { PublicUser } from "@/db/types";
import { HttpError } from "@/lib/http";
import { getSession } from "@/lib/session";

export async function requireUser(): Promise<PublicUser> {
  const session = await getSession();
  if (!session.userId) {
    throw new HttpError(401, "Unauthorized");
  }
  const user = await findUserById(session.userId);
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (user.account_status === "suspended") {
    throw new HttpError(403, "Account suspended");
  }
  return user;
}

export async function requireActiveUser(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "user") {
    throw new HttpError(403, "Forbidden");
  }
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const session = await getSession();
  if (!session.userId) {
    throw new HttpError(401, "Unauthorized");
  }
  const user = await findUserById(session.userId);
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (user.role !== "admin") {
    throw new HttpError(403, "Forbidden");
  }
  return user;
}
