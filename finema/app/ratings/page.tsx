import { redirect } from "next/navigation";
import { findUserById } from "@/db/queries";
import { getSession } from "@/lib/session";
import { RatedMoviesContent } from "@/components/ratings/RatedMoviesContent";

export default async function RatingsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?redirect=/ratings");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login?redirect=/ratings");
  if (user.role === "admin") redirect("/admin");

  return <RatedMoviesContent user={user} />;
}
