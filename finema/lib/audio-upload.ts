import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { saveImageFile } from "@/lib/upload";
import { toAudioPublicUrl } from "@/lib/audio-url";
import {
  analyzeLoudness,
  convertToWav24_44100,
  normalizeAudioToLoudnorm,
  probeAudioFile,
  transcodeAudioToAac,
} from "@/lib/ffmpeg";
import { HttpError } from "@/lib/http";
import { slugifyTitle } from "@/lib/slug";
import { writeUploadToFile } from "@/lib/write-upload";

const TARGET_LUFS = -14;
const LUFS_TOLERANCE = 1.5;
const MAX_TRUE_PEAK = -1.0;

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
}

async function prepareWavMaster(
  inputPath: string,
  ext: string,
  convertedPath: string
): Promise<string> {
  if (ext === ".wav") {
    const probe = await probeAudioFile(inputPath);
    if (probe.sample_rate === 44100 && probe.bits_per_sample === 24) {
      return inputPath;
    }
  }

  await convertToWav24_44100(inputPath, convertedPath);
  return convertedPath;
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
  const tempConverted = path.join(tempDir, "converted.wav");
  const tempNormalized = path.join(tempDir, "normalized.wav");

  try {
    await writeUploadToFile(file, tempInput);

    const wavSource = await prepareWavMaster(tempInput, ext, tempConverted);
    const probe = await probeAudioFile(wavSource);

    const loudness = await analyzeLoudness(wavSource);

    const needsNormalize =
      Math.abs(loudness.input_i - TARGET_LUFS) > LUFS_TOLERANCE ||
      loudness.input_tp > MAX_TRUE_PEAK;

    const masterSource = needsNormalize
      ? await normalizeAudioToLoudnorm(wavSource, tempNormalized).then(
          () => tempNormalized
        )
      : wavSource;

    const mastersDir = path.join(process.cwd(), "public", "audio", "masters");
    const streamsDir = path.join(process.cwd(), "public", "audio", "streams");
    await fs.mkdir(mastersDir, { recursive: true });
    await fs.mkdir(streamsDir, { recursive: true });

    const masterFilename = `${slug}-${Date.now()}.wav`;
    const streamFilename = `${slug}-${Date.now()}.m4a`;
    const masterPath = path.join(mastersDir, masterFilename);
    const streamPath = path.join(streamsDir, streamFilename);

    await fs.copyFile(masterSource, masterPath);
    await transcodeAudioToAac(masterPath, streamPath);

    return {
      audio_url: toAudioPublicUrl(`streams/${streamFilename}`),
      download_url: toAudioPublicUrl(`masters/${masterFilename}`),
      duration_seconds: probe.duration_seconds,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
