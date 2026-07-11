"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { PublicUser } from "@/db/types";
import { updateProfile, deleteAccount } from "@/lib/api-client";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Navbar } from "@/components/layout/Navbar";

const inputClassName =
  "w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-finema-text placeholder:text-finema-muted/50 focus:outline-none focus:ring-2 focus:ring-finema-accent focus:border-transparent transition-shadow disabled:opacity-50";

interface ProfileSettingsContentProps {
  user: PublicUser;
}

export function ProfileSettingsContent({ user: initialUser }: ProfileSettingsContentProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState(initialUser);
  const [displayName, setDisplayName] = useState(initialUser.display_name ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAvatarSuccess(false);
    setAvatarError(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  async function handleNameSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setNameError("Display name is required");
      return;
    }
    if (trimmedName === (user.display_name ?? "")) {
      return;
    }

    setSavingName(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      const formData = new FormData();
      formData.append("displayName", trimmedName);
      const result = await updateProfile(formData);
      setUser(result.user);
      setDisplayName(result.user.display_name ?? "");
      setNameSuccess(true);
      router.refresh();
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedFile) {
      setAvatarError("Please choose an image first");
      return;
    }

    setSavingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(false);

    try {
      const formData = new FormData();
      formData.append("avatar_file", selectedFile);
      const result = await updateProfile(formData);
      setUser(result.user);
      setSelectedFile(null);
      setPreviewUrl(null);
      setAvatarSuccess(true);
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleDeleteAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm deletion");
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount(deletePassword);
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
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
        <Link
          href="/profile"
          className="inline-block text-sm text-finema-muted hover:text-finema-text transition-colors mb-4"
        >
          ← Account
        </Link>
        <h1 className="text-3xl font-bold text-finema-text mb-2">Profile</h1>
        <p className="text-finema-muted mb-8">
          Update your profile picture and account details.
        </p>

        <div className="rounded-lg border border-white/10 bg-finema-surface/40 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              displayName={user.display_name}
              email={user.email}
              avatarUrl={displayAvatarUrl}
              size="lg"
            />
            <div>
              <p className="text-lg font-semibold text-finema-text">
                {user.display_name ?? "User"}
              </p>
              <p className="text-sm text-finema-muted">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-finema-text mb-2"
              >
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setNameSuccess(false);
                  setNameError(null);
                }}
                required
                maxLength={100}
                autoComplete="name"
                disabled={savingName}
                className={inputClassName}
                placeholder="Your name"
              />
            </div>

            {nameError && (
              <p className="text-sm text-red-400" role="alert">
                {nameError}
              </p>
            )}
            {nameSuccess && (
              <p className="text-sm text-finema-success">
                Display name updated successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={
                savingName ||
                !displayName.trim() ||
                displayName.trim() === (user.display_name ?? "")
              }
              className="px-6 py-2 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingName ? "Saving..." : "Save display name"}
            </button>
          </form>

          <form onSubmit={handleAvatarSubmit} className="space-y-4 pt-2 border-t border-white/10">
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

            {avatarError && (
              <p className="text-sm text-red-400" role="alert">
                {avatarError}
              </p>
            )}
            {avatarSuccess && (
              <p className="text-sm text-finema-success">
                Profile image updated successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={savingAvatar || !selectedFile}
              className="px-6 py-2 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingAvatar ? "Saving..." : "Save profile image"}
            </button>
          </form>
        </div>

        {user.role === "user" && (
          <div className="mt-8 rounded-lg border border-red-500/30 bg-red-500/5 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-finema-text">
                Delete account
              </h2>
              <p className="text-sm text-finema-muted mt-1">
                Permanently delete your account, watch history, ratings,
                comments, and saved list. This cannot be undone.
              </p>
            </div>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2 rounded border border-red-500/50 text-red-300 hover:bg-red-500/10 transition-colors"
              >
                Delete my account
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label
                    htmlFor="deletePassword"
                    className="block text-sm font-medium text-finema-text mb-2"
                  >
                    Confirm with your password
                  </label>
                  <input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(event) => {
                      setDeletePassword(event.target.value);
                      setDeleteError(null);
                    }}
                    autoComplete="current-password"
                    disabled={deleting}
                    className={inputClassName}
                    placeholder="Your password"
                  />
                </div>

                {deleteError && (
                  <p className="text-sm text-red-400" role="alert">
                    {deleteError}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={deleting || !deletePassword}
                    className="px-6 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? "Deleting..." : "Permanently delete account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                      setDeleteError(null);
                    }}
                    disabled={deleting}
                    className="px-6 py-2 rounded border border-white/20 hover:border-white/40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </motion.main>
    </div>
  );
}
