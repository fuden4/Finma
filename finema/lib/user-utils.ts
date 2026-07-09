import type { PublicUser } from "@/db/types";

export function isRegularUser(user: PublicUser | null | undefined): boolean {
  return user?.role === "user";
}
