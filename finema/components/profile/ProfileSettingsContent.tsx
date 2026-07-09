"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { PublicUser } from "@/db/types";
import { updateProfile } from "@/lib/api-client";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Navbar } from "@/components/layout/Navbar";

interface ProfileSettingsContentProps {
  user: PublicUser;
}

export function ProfileSettingsContent({ user: initialUser }: ProfileSettingsContentProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState(initialUser);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setSuccess(false);
    setError(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please choose an image first");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("avatar_file", selectedFile);
      const result = await updateProfile(formData);
      setUser(result.user);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  const displayAvatarUrl = previewUrl ?? user.avatar_url;

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-24 px-4 md:px-8 pb-16 max-w-lg mx-auto"
      >
        <h1 className="text-3xl font-bold text-finema-text mb-2">Profile</h1>
        <p className="text-finema-muted mb-8">
          Update your profile picture and account details.
        </p>

        <div className="rounded-lg border border-white/10 bg-finema-surface/40 p-6 space-y-6">
          <div className="flex items-center gap-4">
            {displayAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayAvatarUrl}
                alt={user.display_name ?? user.email}
                className="h-24 w-24 rounded-full object-cover border border-white/10"
              />
            ) : (
              <UserAvatar
                displayName={user.display_name}
                email={user.email}
                avatarUrl={user.avatar_url}
                size="lg"
              />
            )}
            <div>
              <p className="text-lg font-semibold text-finema-text">
                {user.display_name ?? "User"}
              </p>
              <p className="text-sm text-finema-muted">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-finema-text mb-2">
                Profile image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleFileChange}
                className="block w-full text-sm text-finema-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-finema-accent file:text-white file:cursor-pointer hover:file:bg-finema-accent/90"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-finema-success">
                Profile image updated successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !selectedFile}
              className="px-6 py-2 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save profile image"}
            </button>
          </form>
        </div>
      </motion.main>
    </div>
  );
}
