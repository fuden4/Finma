"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AdminMovie, Genre } from "@/db/types";
import {
  createAdminMovie,
  getAdminGenres,
  updateAdminMovie,
} from "@/lib/api-client";
import { UploadZone } from "./UploadZone";
import { ImagePicker, type ImagePickerValue } from "./ImagePicker";

interface MovieFormProps {
  mode: "create" | "edit";
  movie?: AdminMovie;
}

export function MovieForm({ mode, movie }: MovieFormProps) {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    movie?.genres ?? []
  );
  const [newGenre, setNewGenre] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [poster, setPoster] = useState<ImagePickerValue>({
    url: movie?.poster_url ?? "",
    file: null,
  });
  const [backdrop, setBackdrop] = useState<ImagePickerValue>({
    url: movie?.backdrop_url ?? "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminGenres()
      .then(({ genres: list }) => setGenres(list))
      .catch(() => setError("Failed to load genres"));
  }, []);

  useEffect(() => {
    if (!loading) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 200);
    return () => window.clearInterval(id);
  }, [loading]);

  function toggleGenre(name: string) {
    setSelectedGenres((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  }

  function addNewGenre() {
    const trimmed = newGenre.trim();
    if (!trimmed || selectedGenres.includes(trimmed)) return;
    setSelectedGenres((prev) => [...prev, trimmed]);
    setNewGenre("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("genres", JSON.stringify(selectedGenres));
    if (video) {
      formData.set("video", video);
    }

    if (poster.file) {
      formData.set("poster_file", poster.file);
      formData.set("poster_url", "");
    } else {
      formData.set("poster_url", poster.url.trim());
    }

    if (backdrop.file) {
      formData.set("backdrop_file", backdrop.file);
      formData.set("backdrop_url", "");
    } else {
      formData.set("backdrop_url", backdrop.url.trim());
    }

    try {
      if (mode === "create") {
        if (!video) {
          setError("Video file is required");
          setLoading(false);
          return;
        }
        await createAdminMovie(formData);
        router.push("/admin/movies");
      } else if (movie) {
        await updateAdminMovie(movie.id, formData);
        router.push("/admin/movies");
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
          defaultValue={movie?.title ?? ""}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={movie?.description ?? ""}
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Release Year</label>
          <input
            name="release_year"
            type="number"
            min={1900}
            max={2100}
            defaultValue={movie?.release_year ?? ""}
            className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Match Score</label>
          <input
            name="match_score"
            type="number"
            min={0}
            max={100}
            step={0.1}
            defaultValue={movie?.match_score ?? ""}
            className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Quality</label>
          <select
            name="quality_label"
            defaultValue={movie?.quality_label ?? "1080p"}
            className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
          >
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Genres</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre.name)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selectedGenres.includes(genre.name)
                  ? "bg-finema-accent border-finema-accent text-white"
                  : "border-white/20 text-finema-muted hover:border-white/40"
              }`}
            >
              {genre.name}
            </button>
          ))}
          {selectedGenres
            .filter((name) => !genres.some((g) => g.name === name))
            .map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => toggleGenre(name)}
                className="px-3 py-1 rounded-full text-sm border bg-finema-accent border-finema-accent text-white"
              >
                {name}
              </button>
            ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            placeholder="Add new genre"
            className="flex-1 rounded-lg bg-finema-surface border border-white/10 px-4 py-2 focus:border-finema-accent focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNewGenre();
              }
            }}
          />
          <button
            type="button"
            onClick={addNewGenre}
            className="px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ImagePicker
          label="Poster"
          aspect="poster"
          value={poster}
          onChange={setPoster}
          hint="Paste a URL, upload, or paste an image"
        />
        <ImagePicker
          label="Backdrop"
          aspect="backdrop"
          value={backdrop}
          onChange={setBackdrop}
          hint="Paste a URL, upload, or paste an image"
        />
      </div>

      <UploadZone
        value={video}
        onChange={setVideo}
        required={mode === "create"}
        label={mode === "edit" ? "Replace video (optional)" : "Video file (MP4)"}
        hint={
          mode === "edit"
            ? "Upload a new MP4 to re-transcode and replace the stream"
            : "Drag and drop an MP4 file here, or click to browse"
        }
      />

      {loading &&
        (() => {
          if (!video) {
            return (
              <div className="flex items-center gap-3 text-sm text-finema-muted">
                <div className="h-5 w-5 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
                Saving…
              </div>
            );
          }

          const pct = Math.min(95, 100 * (1 - Math.exp(-elapsed / 80)));
          const mins = Math.floor(elapsed / 60);
          const secs = Math.floor(elapsed % 60);
          const clock = `${mins}:${secs.toString().padStart(2, "0")}`;
          const phase =
            elapsed < 3
              ? "Uploading video…"
              : elapsed < 150
                ? "Transcoding to HLS…"
                : "Still transcoding — larger files take a few minutes…";

          return (
            <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-finema-text">
                  <span className="h-4 w-4 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
                  {phase}
                </span>
                <span className="tabular-nums text-finema-muted">{clock}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-finema-accent transition-all duration-200 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-finema-muted">
                Please keep this tab open. The video is being encoded on the
                server and will finish automatically.
              </p>
            </div>
          );
        })()}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-finema-accent text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {mode === "create" ? "Create Movie" : "Save Changes"}
        </button>
        <Link
          href="/admin/movies"
          className="px-6 py-2.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </motion.form>
  );
}
