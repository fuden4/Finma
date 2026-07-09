import { redirect } from "next/navigation";
import { findUserById } from "@/db/queries";
import { getSession } from "@/lib/session";
import { WatchlistContent } from "@/components/watchlist/WatchlistContent";

export default async function WatchlistPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?redirect=/watchlist");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login?redirect=/watchlist");
  if (user.role === "admin") redirect("/admin");

  return <WatchlistContent user={user} />;
}
