"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminSeries, Episode, Genre, SeriesDetail } from "@/db/types";
import {
  createAdminEpisode,
  createAdminSeries,
  getAdminGenres,
  getAdminSeries,
  getAdminSeriesById,
  updateAdminSeries,
} from "@/lib/api-client";
import { UploadZone } from "./UploadZone";
import { ImagePicker, type ImagePickerValue } from "./ImagePicker";

type FormMode = "create" | "add-episode" | "edit";

interface SeriesFormProps {
  mode: FormMode;
  series?: SeriesDetail;
}

function getNextEpisodeNumbers(episodes: Episode[]): {
  season_number: number;
  episode_number: number;
} {
  if (episodes.length === 0) {
    return { season_number: 1, episode_number: 1 };
  }

  const sorted = [...episodes].sort((a, b) => {
    if (a.season_number !== b.season_number) {
      return a.season_number - b.season_number;
    }
    return a.episode_number - b.episode_number;
  });
  const last = sorted[sorted.length - 1];
  return {
    season_number: last.season_number,
    episode_number: last.episode_number + 1,
  };
}

export function SeriesForm({ mode, series }: SeriesFormProps) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"new" | "episode">(
    mode === "add-episode" ? "episode" : "new"
  );
  const [allSeries, setAllSeries] = useState<AdminSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState(
    series?.id ?? ""
  );
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    series?.genres ?? []
  );
  const [newGenre, setNewGenre] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [poster, setPoster] = useState<ImagePickerValue>({
    url: series?.poster_url ?? "",
    file: null,
  });
  const [backdrop, setBackdrop] = useState<ImagePickerValue>({
    url: series?.backdrop_url ?? "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);

  const selectedSeries = allSeries.find((s) => s.id === selectedSeriesId);

  useEffect(() => {
    getAdminGenres()
      .then(({ genres: list }) => setGenres(list))
      .catch(() => setError("Failed to load genres"));
    if (mode !== "edit") {
      getAdminSeries()
        .then(({ series: list }) => setAllSeries(list))
        .catch(() => setError("Failed to load series list"));
    }
  }, [mode]);

  useEffect(() => {
    if (formMode !== "episode" || !selectedSeriesId) {
      return;
    }

    let cancelled = false;
    getAdminSeriesById(selectedSeriesId)
      .then(({ series: detail }) => {
        if (cancelled) return;
        const next = getNextEpisodeNumbers(detail.episodes);
        setSeasonNumber(next.season_number);
        setEpisodeNumber(next.episode_number);
      })
      .catch(() => {
        if (!cancelled) {
          setSeasonNumber(1);
          setEpisodeNumber(1);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [formMode, selectedSeriesId]);

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

    try {
      if (mode === "edit" && series) {
        formData.set("genres", JSON.stringify(selectedGenres));
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
        await updateAdminSeries(series.id, formData);
        router.push("/admin/series");
      } else if (formMode === "episode") {
        if (!selectedSeriesId) {
          setError("Please select a series");
          setLoading(false);
          return;
        }
        if (!video) {
          setError("Video file is required for a new episode");
          setLoading(false);
          return;
        }
        formData.set("video", video);
        await createAdminEpisode(selectedSeriesId, formData);
        router.push("/admin/series");
      } else {
        formData.set("genres", JSON.stringify(selectedGenres));
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
        if (video) {
          formData.set("video", video);
        }
        await createAdminSeries(formData);
        router.push("/admin/series");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const showSeriesFields = mode === "edit" || formMode === "new";
  const showEpisodeFields = mode !== "edit" && formMode === "episode";
  const showOptionalFirstEpisode = mode !== "edit" && formMode === "new";

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

      {mode !== "edit" && (
        <div className="flex rounded-lg border border-white/10 p-1 bg-finema-surface/50">
          <button
            type="button"
            onClick={() => setFormMode("new")}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              formMode === "new"
                ? "bg-finema-accent text-white"
                : "text-finema-muted hover:text-finema-text"
            }`}
          >
            Create new series
          </button>
          <button
            type="button"
            onClick={() => setFormMode("episode")}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              formMode === "episode"
                ? "bg-finema-accent text-white"
                : "text-finema-muted hover:text-finema-text"
            }`}
          >
            Add episode to existing series
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showEpisodeFields && (
          <motion.div
            key="episode-select"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">
                Select series *
              </label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                required
                className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
              >
                <option value="">Choose a series…</option>
                {allSeries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.episode_count ?? 0} episodes)
                  </option>
                ))}
              </select>
            </div>

            {selectedSeries && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-finema-surface/30"
              >
                {selectedSeries.poster_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedSeries.poster_url}
                    alt={selectedSeries.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-semibold text-finema-text">
                    {selectedSeries.title}
                  </p>
                  <p className="text-sm text-finema-muted">
                    {selectedSeries.episode_count ?? 0} episodes ·{" "}
                    {selectedSeries.genres.join(", ") || "No genres"}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showSeriesFields && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              name="title"
              required
              defaultValue={series?.title ?? ""}
              className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={series?.description ?? ""}
              className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Release Year</label>
              <input
                name="release_year"
                type="number"
                min={1900}
                max={2100}
                defaultValue={series?.release_year ?? ""}
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
                defaultValue={series?.match_score ?? ""}
                className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
              />
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
            />
            <ImagePicker
              label="Backdrop"
              aspect="backdrop"
              value={backdrop}
              onChange={setBackdrop}
            />
          </div>
        </>
      )}

      {(showEpisodeFields || showOptionalFirstEpisode) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-white/10 bg-finema-surface/30 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-finema-text uppercase tracking-wide">
            {showEpisodeFields ? "New episode" : "First episode (optional)"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Season #</label>
              <input
                name="season_number"
                type="number"
                min={1}
                value={showEpisodeFields ? seasonNumber : 1}
                onChange={(e) =>
                  setSeasonNumber(Number.parseInt(e.target.value, 10) || 1)
                }
                readOnly={!showEpisodeFields}
                className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Episode #</label>
              <input
                name="episode_number"
                type="number"
                min={1}
                value={showEpisodeFields ? episodeNumber : 1}
                onChange={(e) =>
                  setEpisodeNumber(Number.parseInt(e.target.value, 10) || 1)
                }
                readOnly={!showEpisodeFields}
                className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Episode title {showEpisodeFields ? "*" : ""}
            </label>
            <input
              name="episode_title"
              required={showEpisodeFields}
              placeholder="e.g. Pilot"
              className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Episode description
            </label>
            <textarea
              name="episode_description"
              rows={2}
              className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              name="quality_label"
              defaultValue="1080p"
              className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
            >
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
            </select>
          </div>

          <UploadZone
            value={video}
            onChange={setVideo}
            required={showEpisodeFields}
            label={
              showEpisodeFields
                ? "Episode video (MP4) *"
                : "First episode video (optional)"
            }
          />
        </motion.div>
      )}

      {loading && video && (
        <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-finema-text">
            <span className="h-4 w-4 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
            Transcoding episode video… ({Math.floor(elapsed)}s)
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-finema-accent text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {mode === "edit"
            ? "Save Changes"
            : formMode === "episode"
              ? "Add Episode"
              : "Create Series"}
        </button>
        <Link
          href="/admin/series"
          className="px-6 py-2.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </motion.form>
  );
}
