import { redirect } from "next/navigation";
import { findUserById } from "@/db/queries";
import { getSession } from "@/lib/session";
import { ProfileSettingsContent } from "@/components/profile/ProfileSettingsContent";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }

  const user = await findUserById(session.userId);
  if (!user) {
    redirect("/login");
  }

  return <ProfileSettingsContent user={user} />;
}
