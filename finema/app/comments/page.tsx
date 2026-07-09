import { redirect } from "next/navigation";
import { findUserById } from "@/db/queries";
import { getSession } from "@/lib/session";
import { MyCommentsContent } from "@/components/comments/MyCommentsContent";

export default async function CommentsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?redirect=/comments");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login?redirect=/comments");
  if (user.role === "admin") redirect("/admin");

  return <MyCommentsContent user={user} />;
}
