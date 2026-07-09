import { redirect } from "next/navigation";
import { findUserById } from "@/db/queries";
import { getSession } from "@/lib/session";
import { WatchHistoryContent } from "@/components/watch-history/WatchHistoryContent";

export default async function WatchHistoryPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?redirect=/watch-history");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login?redirect=/watch-history");
  if (user.role === "admin") redirect("/admin");

  return <WatchHistoryContent user={user} />;
}
