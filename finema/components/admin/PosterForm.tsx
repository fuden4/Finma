"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import type { AdminPoster } from "@/db/types";
import { createAdminPoster, updateAdminPoster } from "@/lib/api-client";
import { ImagePicker, type ImagePickerValue } from "./ImagePicker";

interface PosterFormProps {
  mode: "create" | "edit";
  poster?: AdminPoster;
}

export function PosterForm({ mode, poster }: PosterFormProps) {
  const router = useRouter();
  const [image, setImage] = useState<ImagePickerValue>({
    url: poster?.image_url ?? "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (image.file) {
      formData.set("image_file", image.file);
      formData.set("image_url", "");
    } else {
      formData.set("image_url", image.url.trim());
    }

    if (mode === "create" && !image.file && !image.url.trim()) {
      setError("Image is required");
      setLoading(false);
      return;
    }

    try {
      if (mode === "create") {
        await createAdminPoster(formData);
        router.push("/admin/posters");
      } else if (poster) {
        await updateAdminPoster(poster.id, formData);
        router.push("/admin/posters");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-6"
    >
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Title *</label>
        <input
          name="title"
          required
          defaultValue={poster?.title ?? ""}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={poster?.description ?? ""}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none resize-y"
        />
      </div>

      <ImagePicker
        label={mode === "create" ? "Poster Image *" : "Poster Image"}
        value={image}
        onChange={setImage}
        aspect="poster"
        hint={
          mode === "edit"
            ? "Leave unchanged to keep the current image."
            : undefined
        }
      />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-finema-accent text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : mode === "create" ? "Create Poster" : "Save Changes"}
        </button>
        <Link
          href="/admin/posters"
          className="px-5 py-2.5 rounded-lg border border-white/10 text-finema-muted hover:text-finema-text transition-colors"
        >
          Cancel
        </Link>
      </div>
    </motion.form>
  );
}
