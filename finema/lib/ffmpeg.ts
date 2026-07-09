import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function getFfmpegPath(): string {
  return process.env.FFMPEG_PATH ?? "ffmpeg";
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
}

export async function transcodeToHls(
  inputPath: string,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });
  const playlistPath = path.join(outputDir, "index.m3u8");
  const segmentPattern = path.join(outputDir, "segment_%03d.ts");

  const ffmpeg = getFfmpegPath();
  await execFileAsync(ffmpeg, [
    "-y",
    "-i",
    inputPath,
    "-c:v",
    "libx264",
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

  return playlistPath;
}
