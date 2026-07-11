import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { HttpError } from "@/lib/http";

const execFileAsync = promisify(execFile);

function getExecErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const stderr = "stderr" in error ? String(error.stderr).trim() : "";
  const message = "message" in error ? String(error.message).trim() : "";
  return stderr || message || null;
}

export function getFfmpegPath(): string {
  const configured = process.env.FFMPEG_PATH?.trim();
  if (configured && existsSync(configured)) {
    return configured;
  }
  return "ffmpeg";
}

function getFfprobePath(): string {
  const ffmpeg = getFfmpegPath();
  if (ffmpeg.toLowerCase().endsWith("ffmpeg.exe")) {
    return ffmpeg.replace(/ffmpeg\.exe$/i, "ffprobe.exe");
  }
  if (ffmpeg.endsWith("ffmpeg")) {
    return ffmpeg.replace(/ffmpeg$/, "ffprobe");
  }
  return "ffprobe";
}

export async function probeDuration(filePath: string): Promise<number> {
  const ffprobe = getFfprobePath();
  try {
    const { stdout } = await execFileAsync(ffprobe, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const seconds = Math.round(parseFloat(stdout.trim()));
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error("Could not determine video duration");
    }
    return seconds;
  } catch (error) {
    const details = getExecErrorMessage(error);
    throw new HttpError(
      500,
      details
        ? `Could not read video duration: ${details}`
        : "Could not read video duration"
    );
  }
}

export async function transcodeToHls(
  inputPath: string,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });
  const playlistPath = path.join(outputDir, "index.m3u8");
  const segmentPattern = path.join(outputDir, "segment_%03d.ts");

  const ffmpeg = getFfmpegPath();
  try {
    await execFileAsync(ffmpeg, [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-c:a",
      "aac",
      "-hls_time",
      "10",
      "-hls_list_size",
      "0",
      "-hls_segment_filename",
      segmentPattern,
      playlistPath,
    ]);
  } catch (error) {
    const details = getExecErrorMessage(error);
    throw new HttpError(
      500,
      details ? `Video transcoding failed: ${details}` : "Video transcoding failed"
    );
  }

  return playlistPath;
}
