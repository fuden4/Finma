import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { HttpError } from "@/lib/http";
import { probeDuration, transcodeToHls } from "@/lib/ffmpeg";
import { slugifyTitle } from "@/lib/slug";
import { saveImageFile } from "@/lib/upload";
import { toVideoPublicUrl } from "@/lib/video-url";
import { writeUploadToFile } from "@/lib/write-upload";

export interface ParsedMovieForm {
  title: string;
  description: string | null;
  release_year: number | null;
  match_score: number | null;
  quality_label: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  poster_file: File | null;
  backdrop_file: File | null;
  genres: string[];
  video: File | null;
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalFloat(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseGenres(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseRequiredInt(
  value: FormDataEntryValue | null,
  field: string,
  min = 1
): number {
  const parsed = parseOptionalInt(value);
  if (parsed === null || parsed < min) {
    throw new HttpError(400, `${field} must be an integer >= ${min}`);
  }
  return parsed;
}

export interface ParsedSeriesForm {
  title: string;
  description: string | null;
  release_year: number | null;
  match_score: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  poster_file: File | null;
  backdrop_file: File | null;
  genres: string[];
  season_number: number;
  episode_number: number;
  episode_title: string | null;
  episode_description: string | null;
  quality_label: string | null;
  video: File | null;
}

export interface ParsedEpisodeForm {
  season_number: number;
  episode_number: number;
  title: string;
  description: string | null;
  quality_label: string | null;
  video: File | null;
}

export function parseSeriesFormData(formData: FormData): ParsedSeriesForm {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    throw new HttpError(400, "Title is required");
  }

  const videoEntry = formData.get("video");
  const video =
    videoEntry instanceof File && videoEntry.size > 0 ? videoEntry : null;

  const posterEntry = formData.get("poster_file");
  const poster_file =
    posterEntry instanceof File && posterEntry.size > 0 ? posterEntry : null;

  const backdropEntry = formData.get("backdrop_file");
  const backdrop_file =
    backdropEntry instanceof File && backdropEntry.size > 0
      ? backdropEntry
      : null;

  const episodeTitle = String(formData.get("episode_title") ?? "").trim();

  return {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    release_year: parseOptionalInt(formData.get("release_year")),
    match_score: parseOptionalFloat(formData.get("match_score")),
    poster_url: String(formData.get("poster_url") ?? "").trim() || null,
    backdrop_url: String(formData.get("backdrop_url") ?? "").trim() || null,
    poster_file,
    backdrop_file,
    genres: parseGenres(formData.get("genres")),
    season_number: parseOptionalInt(formData.get("season_number")) ?? 1,
    episode_number: parseOptionalInt(formData.get("episode_number")) ?? 1,
    episode_title: episodeTitle || null,
    episode_description:
      String(formData.get("episode_description") ?? "").trim() || null,
    quality_label: String(formData.get("quality_label") ?? "").trim() || null,
    video,
  };
}

export function parseEpisodeFormData(formData: FormData): ParsedEpisodeForm {
  const title = String(
    formData.get("episode_title") ?? formData.get("title") ?? ""
  ).trim();
  if (!title) {
    throw new HttpError(400, "Episode title is required");
  }

  const videoEntry = formData.get("video");
  const video =
    videoEntry instanceof File && videoEntry.size > 0 ? videoEntry : null;
  if (!video) {
    throw new HttpError(400, "Video file is required");
  }

  return {
    season_number: parseRequiredInt(formData.get("season_number"), "season_number"),
    episode_number: parseRequiredInt(
      formData.get("episode_number"),
      "episode_number"
    ),
    title,
    description:
      String(
        formData.get("episode_description") ?? formData.get("description") ?? ""
      ).trim() || null,
    quality_label: String(formData.get("quality_label") ?? "").trim() || null,
    video,
  };
}

export async function resolveSeriesImageUrls(
  parsed: Pick<
    ParsedSeriesForm,
    "poster_url" | "backdrop_url" | "poster_file" | "backdrop_file"
  >,
  title: string
): Promise<{ poster_url: string | null; backdrop_url: string | null }> {
  const slug = slugifyTitle(title) || "series";
  let poster_url = parsed.poster_url;
  let backdrop_url = parsed.backdrop_url;

  if (parsed.poster_file) {
    poster_url = await saveImage(parsed.poster_file, slug, "poster");
  }
  if (parsed.backdrop_file) {
    backdrop_url = await saveImage(parsed.backdrop_file, slug, "backdrop");
  }

  return { poster_url, backdrop_url };
}

export function parseMovieFormData(formData: FormData): ParsedMovieForm {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    throw new HttpError(400, "Title is required");
  }

  const videoEntry = formData.get("video");
  const video =
    videoEntry instanceof File && videoEntry.size > 0 ? videoEntry : null;

  const posterEntry = formData.get("poster_file");
  const poster_file =
    posterEntry instanceof File && posterEntry.size > 0 ? posterEntry : null;

  const backdropEntry = formData.get("backdrop_file");
  const backdrop_file =
    backdropEntry instanceof File && backdropEntry.size > 0
      ? backdropEntry
      : null;

  return {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    release_year: parseOptionalInt(formData.get("release_year")),
    match_score: parseOptionalFloat(formData.get("match_score")),
    quality_label: String(formData.get("quality_label") ?? "").trim() || null,
    poster_url: String(formData.get("poster_url") ?? "").trim() || null,
    backdrop_url: String(formData.get("backdrop_url") ?? "").trim() || null,
    poster_file,
    backdrop_file,
    genres: parseGenres(formData.get("genres")),
    video,
  };
}


async function saveImage(
  file: File,
  slug: string,
  kind: "poster" | "backdrop"
): Promise<string> {
  return saveImageFile(file, {
    directory: "images",
    filenamePrefix: `${slug}-${kind}`,
  });
}

export async function resolveImageUrls(
  parsed: ParsedMovieForm,
  title: string
): Promise<{ poster_url: string | null; backdrop_url: string | null }> {
  const slug = slugifyTitle(title) || "movie";
  let poster_url = parsed.poster_url;
  let backdrop_url = parsed.backdrop_url;

  if (parsed.poster_file) {
    poster_url = await saveImage(parsed.poster_file, slug, "poster");
  }
  if (parsed.backdrop_file) {
    backdrop_url = await saveImage(parsed.backdrop_file, slug, "backdrop");
  }

  return { poster_url, backdrop_url };
}

export interface TranscodeResult {
  hls_playlist_url: string;
  duration_seconds: number;
  outputDir: string;
}

export async function saveAndTranscodeVideo(
  video: File,
  title: string
): Promise<TranscodeResult> {
  const slug = slugifyTitle(title);
  if (!slug) {
    throw new HttpError(400, "Could not generate video folder from title");
  }

  const tempPath = path.join(
    os.tmpdir(),
    `finema-upload-${Date.now()}-${video.name.replace(/[^\w.-]/g, "_")}`
  );

  await writeUploadToFile(video, tempPath);

  try {
    const duration_seconds = await probeDuration(tempPath);
    const outputDir = path.join(
      process.cwd(),
      "public",
      "videos",
      "uploads",
      slug
    );
    await transcodeToHls(tempPath, outputDir);
    return {
      hls_playlist_url: toVideoPublicUrl(`uploads/${slug}/index.m3u8`),
      duration_seconds,
      outputDir,
    };
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}
