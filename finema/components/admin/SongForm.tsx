"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AdminSong, SongCategory } from "@/db/types";
import {
  createAdminSong,
  getAdminSongCategories,
  updateAdminSong,
} from "@/lib/api-client";
import { ImagePicker, type ImagePickerValue } from "./ImagePicker";

interface SongFormProps {
  mode: "create" | "edit";
  song?: AdminSong;
}

export function SongForm({ mode, song }: SongFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [cover, setCover] = useState<ImagePickerValue>({
    url: song?.cover_url ?? "",
    file: null,
  });
  const [audio, setAudio] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminSongCategories()
      .then(({ categories: list }) => setCategories(list))
      .catch(() => setError("Failed to load categories"));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (cover.file) {
      formData.set("cover_file", cover.file);
      formData.set("cover_url", "");
    } else {
      formData.set("cover_url", cover.url.trim());
    }

    if (audio) {
      formData.set("audio_file", audio);
    }

    if (mode === "create" && !audio) {
      setError("Audio file is required");
      setLoading(false);
      return;
    }

    if (mode === "create" && !cover.file && !cover.url.trim()) {
      setError("Cover image is required");
      setLoading(false);
      return;
    }

    try {
      if (mode === "create") {
        await createAdminSong(formData);
        router.push("/admin/songs");
      } else if (song) {
        await updateAdminSong(song.id, formData);
        router.push("/admin/songs");
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
          defaultValue={song?.title ?? ""}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Artist</label>
        <input
          name="artist"
          defaultValue={song?.artist ?? ""}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={song?.description ?? ""}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          name="category_id"
          defaultValue={song?.category_id ?? ""}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <ImagePicker
        label={mode === "create" ? "Cover Image *" : "Cover Image"}
        value={cover}
        onChange={setCover}
        aspect="poster"
      />

      <div>
        <label className="block text-sm font-medium mb-2">
          {mode === "create" ? "Audio file (WAV, MP3, or M4A) *" : "Replace audio file"}
        </label>
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
          <input
            type="file"
            accept="audio/wav,audio/mpeg,audio/mp4,.wav,.mp3,.m4a,.aac"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-finema-muted file:mr-4 file:rounded-lg file:border-0 file:bg-finema-accent file:px-4 file:py-2 file:text-white"
          />
          {audio && (
            <p className="mt-2 text-sm text-finema-text">{audio.name}</p>
          )}
          <p className="mt-2 text-xs text-finema-muted">
            MP3 and M4A are auto-converted to 24-bit / 44.1 kHz WAV. Loudness
            and peak levels are adjusted automatically to platform standards.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-finema-accent text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : mode === "create" ? "Create Song" : "Save Changes"}
        </button>
        <Link
          href="/admin/songs"
          className="px-5 py-2.5 rounded-lg border border-white/10 text-finema-muted hover:text-finema-text transition-colors"
        >
          Cancel
        </Link>
      </div>
    </motion.form>
  );
}
