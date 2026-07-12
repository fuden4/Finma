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
import {
  formatSourceLufs,
  formatVolumeAdjustmentDb,
  PLATFORM_TARGET_LUFS,
} from "@/lib/song-loudness";
import { ImagePicker, type ImagePickerValue } from "./ImagePicker";

interface SongFormProps {
  mode: "create" | "edit";
  song?: AdminSong;
}

type UploadPhase = "idle" | "uploading" | "processing";

export function SongForm({ mode, song }: SongFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [cover, setCover] = useState<ImagePickerValue>({
    url: song?.cover_url ?? "",
    file: null,
  });
  const [audio, setAudio] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState("");
  const [loudnessMeta, setLoudnessMeta] = useState({
    source_lufs: song?.source_lufs ?? null,
    volume_adjustment_db: song?.volume_adjustment_db ?? 0,
  });

  useEffect(() => {
    if (!song) return;
    setLoudnessMeta({
      source_lufs: song.source_lufs,
      volume_adjustment_db: song.volume_adjustment_db,
    });
  }, [song]);

  useEffect(() => {
    getAdminSongCategories()
      .then(({ categories: list }) => setCategories(list))
      .catch(() => setError("Failed to load categories"));
  }, []);

  function handleUploadProgress(percent: number) {
    setUploadProgress(percent);
    if (percent >= 100) {
      setUploadPhase("processing");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setUploadProgress(0);
    setUploadPhase("uploading");

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
      setUploadPhase("idle");
      return;
    }

    if (mode === "create" && !cover.file && !cover.url.trim()) {
      setError("Cover image is required");
      setLoading(false);
      setUploadPhase("idle");
      return;
    }

    try {
      if (mode === "create") {
        const { song: created } = await createAdminSong(formData, {
          onUploadProgress: handleUploadProgress,
        });
        setLoudnessMeta({
          source_lufs: created.source_lufs,
          volume_adjustment_db: created.volume_adjustment_db,
        });
        router.push("/admin/songs");
      } else if (song) {
        const { song: updated } = await updateAdminSong(song.id, formData, {
          onUploadProgress: audio ? handleUploadProgress : undefined,
        });
        setLoudnessMeta({
          source_lufs: updated.source_lufs,
          volume_adjustment_db: updated.volume_adjustment_db,
        });
        router.push("/admin/songs");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setUploadPhase("idle");
    }
  }

  const isAudioUpload = mode === "create" || audio != null;
  const showUploadProgress = loading && isAudioUpload;
  const showLoudnessPanel = mode === "edit" || loudnessMeta.source_lufs != null;

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
          disabled={loading}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Artist</label>
        <input
          name="artist"
          defaultValue={song?.artist ?? ""}
          disabled={loading}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={song?.description ?? ""}
          disabled={loading}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none resize-y disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          name="category_id"
          defaultValue={song?.category_id ?? ""}
          disabled={loading}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none disabled:opacity-60"
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
          {mode === "create"
            ? "Audio file (MP3, M4A, WAV, or AAC) *"
            : "Replace audio file"}
        </label>
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
          <input
            type="file"
            accept="audio/wav,audio/mpeg,audio/mp4,.wav,.mp3,.m4a,.aac"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            disabled={loading}
            className="block w-full text-sm text-finema-muted file:mr-4 file:rounded-lg file:border-0 file:bg-finema-accent file:px-4 file:py-2 file:text-white disabled:opacity-60"
          />
          {audio && (
            <p className="mt-2 text-sm text-finema-text">{audio.name}</p>
          )}
          <p className="mt-2 text-xs text-finema-muted">
            Audio files are stored as uploaded. Loudness is measured on save and
            normalized at playback to platform standards ({PLATFORM_TARGET_LUFS}{" "}
            LUFS).
          </p>
        </div>
      </div>

      {showLoudnessPanel && (
        <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-4">
          <h3 className="text-sm font-medium mb-3">Audio loudness metadata</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-finema-muted mb-1">Source loudness</dt>
              <dd className="font-medium">
                {formatSourceLufs(loudnessMeta.source_lufs)}
              </dd>
            </div>
            <div>
              <dt className="text-finema-muted mb-1">Playback adjustment</dt>
              <dd className="font-medium">
                {formatVolumeAdjustmentDb(
                  loudnessMeta.volume_adjustment_db,
                  loudnessMeta.source_lufs
                )}
              </dd>
            </div>
            <div>
              <dt className="text-finema-muted mb-1">Platform target</dt>
              <dd className="font-medium">{PLATFORM_TARGET_LUFS} LUFS</dd>
            </div>
          </dl>
          {loudnessMeta.source_lufs == null && (
            <p className="mt-3 text-xs text-amber-300/90">
              Loudness not measured yet. Replace the audio file or run the
              backfill script to populate metadata.
            </p>
          )}
        </div>
      )}

      {showUploadProgress && (
        <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-finema-text">
              {uploadPhase === "processing"
                ? "Processing audio (measuring loudness)…"
                : "Uploading audio…"}
            </span>
            <span className="text-finema-muted tabular-nums">
              {uploadProgress}%
            </span>
          </div>
          <div
            className="h-2.5 rounded-full bg-white/10 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadProgress}
            aria-label="Song upload progress"
          >
            <div
              className={`h-full rounded-full bg-finema-accent transition-[width] duration-200 ${
                uploadPhase === "processing" ? "animate-pulse" : ""
              }`}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-finema-accent text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading
            ? !isAudioUpload
              ? "Saving…"
              : uploadPhase === "processing"
                ? "Processing…"
                : "Uploading…"
            : mode === "create"
              ? "Create Song"
              : "Save Changes"}
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
