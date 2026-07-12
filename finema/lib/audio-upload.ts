import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { saveImageFile } from "@/lib/upload";
import { toAudioPublicUrl } from "@/lib/audio-url";
import { measureSourceLoudness, probeAudioFile } from "@/lib/ffmpeg";
import { HttpError } from "@/lib/http";
import { slugifyTitle } from "@/lib/slug";
import { writeUploadToFile } from "@/lib/write-upload";

const ALLOWED_AUDIO_EXTENSIONS = new Set([".wav", ".mp3", ".m4a", ".aac"]);

export interface ParsedSongForm {
  title: string;
  description: string | null;
  artist: string | null;
  category_id: string | null;
  cover_url: string | null;
  cover_file: File | null;
  audio_file: File | null;
}

export function parseSongFormData(formData: FormData): ParsedSongForm {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    throw new HttpError(400, "Title is required");
  }

  const coverEntry = formData.get("cover_file");
  const cover_file =
    coverEntry instanceof File && coverEntry.size > 0 ? coverEntry : null;

  const audioEntry = formData.get("audio_file");
  const audio_file =
    audioEntry instanceof File && audioEntry.size > 0 ? audioEntry : null;

  const categoryRaw = String(formData.get("category_id") ?? "").trim();

  return {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    artist: String(formData.get("artist") ?? "").trim() || null,
    category_id: categoryRaw || null,
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    cover_file,
    audio_file,
  };
}

export async function resolveSongCoverUrl(
  parsed: ParsedSongForm,
  title: string
): Promise<string> {
  if (parsed.cover_file) {
    const slug = slugifyTitle(title) || "song";
    return saveImageFile(parsed.cover_file, {
      directory: "images/songs",
      filenamePrefix: slug,
    });
  }
  if (parsed.cover_url) {
    return parsed.cover_url;
  }
  throw new HttpError(400, "Cover image is required");
}

export interface ProcessedSongAudio {
  audio_url: string;
  download_url: string;
  duration_seconds: number;
  source_lufs: number;
}

export async function processSongAudioUpload(
  file: File,
  title: string
): Promise<ProcessedSongAudio> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
    throw new HttpError(400, "Audio must be WAV, MP3, or M4A");
  }

  const slug = slugifyTitle(title) || "song";
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "finema-song-"));
  const tempInput = path.join(tempDir, `input${ext}`);

  try {
    await writeUploadToFile(file, tempInput);

    const probe = await probeAudioFile(tempInput);
    const loudness = await measureSourceLoudness(tempInput);

    const originalsDir = path.join(process.cwd(), "public", "audio", "originals");
    await fs.mkdir(originalsDir, { recursive: true });

    const filename = `${slug}-${Date.now()}${ext}`;
    const storedPath = path.join(originalsDir, filename);
    await fs.copyFile(tempInput, storedPath);

    const publicPath = `originals/${filename}`;
    const publicUrl = toAudioPublicUrl(publicPath);

    return {
      audio_url: publicUrl,
      download_url: publicUrl,
      duration_seconds: probe.duration_seconds,
      source_lufs: loudness.input_i,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
