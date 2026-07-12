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

export interface AudioProbeInfo {
  duration_seconds: number;
  sample_rate: number;
  bits_per_sample: number;
}

export async function probeAudioFile(filePath: string): Promise<AudioProbeInfo> {
  const ffprobe = getFfprobePath();
  try {
    const { stdout } = await execFileAsync(ffprobe, [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_entries",
      "stream=sample_rate,bits_per_sample:format=duration",
      "-of",
      "json",
      filePath,
    ]);
    const parsed = JSON.parse(stdout) as {
      streams?: Array<{ sample_rate?: string; bits_per_sample?: string }>;
      format?: { duration?: string };
    };
    const stream = parsed.streams?.[0];
    const duration = Math.round(
      parseFloat(parsed.format?.duration ?? "0")
    );
    const sampleRate = Number.parseInt(stream?.sample_rate ?? "0", 10);
    const bitsPerSample = Number.parseInt(stream?.bits_per_sample ?? "0", 10);

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Could not determine audio duration");
    }

    return {
      duration_seconds: duration,
      sample_rate: sampleRate,
      bits_per_sample: bitsPerSample,
    };
  } catch (error) {
    const details = getExecErrorMessage(error);
    throw new HttpError(
      500,
      details
        ? `Could not read audio file: ${details}`
        : "Could not read audio file"
    );
  }
}

export interface LoudnormStats {
  input_i: number;
  input_tp: number;
  output_i?: number;
  output_tp?: number;
}

export async function measureSourceLoudness(filePath: string): Promise<LoudnormStats> {
  const ffmpeg = getFfmpegPath();
  try {
    const { stderr } = await execFileAsync(ffmpeg, [
      "-hide_banner",
      "-i",
      filePath,
      "-af",
      "loudnorm=print_format=json",
      "-f",
      "null",
      "-",
    ]);
    const match = stderr.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Could not parse loudness analysis");
    }
    const data = JSON.parse(match[0]) as {
      input_i?: string;
      input_tp?: string;
    };
    return {
      input_i: Number.parseFloat(data.input_i ?? "0"),
      input_tp: Number.parseFloat(data.input_tp ?? "0"),
    };
  } catch (error) {
    const details = getExecErrorMessage(error);
    throw new HttpError(
      500,
      details ? `Loudness measurement failed: ${details}` : "Loudness measurement failed"
    );
  }
}

export async function analyzeLoudness(filePath: string): Promise<LoudnormStats> {
  const ffmpeg = getFfmpegPath();
  try {
    const { stderr } = await execFileAsync(ffmpeg, [
      "-hide_banner",
      "-i",
      filePath,
      "-af",
      "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json",
      "-f",
      "null",
      "-",
    ]);
    const match = stderr.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Could not parse loudness analysis");
    }
    const data = JSON.parse(match[0]) as {
      input_i?: string;
      input_tp?: string;
    };
    return {
      input_i: Number.parseFloat(data.input_i ?? "0"),
      input_tp: Number.parseFloat(data.input_tp ?? "0"),
    };
  } catch (error) {
    const details = getExecErrorMessage(error);
    throw new HttpError(
      500,
      details ? `Loudness analysis failed: ${details}` : "Loudness analysis failed"
    );
  }
}

export async function normalizeAudioToLoudnorm(
  inputPath: string,
  outputPath: string
): Promise<LoudnormStats> {
  const ffmpeg = getFfmpegPath();
  const stats = await analyzeLoudness(inputPath);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  try {
    const { stderr } = await execFileAsync(ffmpeg, [
      "-y",
      "-i",
      inputPath,
      "-af",
      `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=11:measured_thresh=-24:offset=0:linear=true:print_format=json`,
      "-ar",
      "44100",
      "-c:a",
      "pcm_s24le",
      outputPath,
    ]);
    const match = stderr.match(/\{[\s\S]*\}/);
    if (match) {
      const data = JSON.parse(match[0]) as {
        output_i?: string;
        output_tp?: string;
      };
      return {
        ...stats,
        output_i: Number.parseFloat(data.output_i ?? "-14"),
        output_tp: Number.parseFloat(data.output_tp ?? "-1"),
      };
    }
    return stats;
  } catch (error) {
    const details = getExecErrorMessage(error);
    throw new HttpError(
      500,
      details ? `Audio normalization failed: ${details}` : "Audio normalization failed"
    );
  }
}

export async function transcodeAudioToAac(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const ffmpeg = getFfmpegPath();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  try {
    await execFileAsync(ffmpeg, [
      "-y",
      "-i",
      inputPath,
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "44100",
      outputPath,
    ]);
  } catch (error) {
    const details = getExecErrorMessage(error);
    throw new HttpError(
      500,
      details ? `Audio transcoding failed: ${details}` : "Audio transcoding failed"
    );
  }
}

export async function convertToWav24_44100(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const ffmpeg = getFfmpegPath();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  try {
    await execFileAsync(ffmpeg, [
      "-y",
      "-i",
      inputPath,
      "-ar",
      "44100",
      "-c:a",
      "pcm_s24le",
      outputPath,
    ]);
  } catch (error) {
    const details = getExecErrorMessage(error);
    throw new HttpError(
      500,
      details ? `Audio conversion failed: ${details}` : "Audio conversion failed"
    );
  }
}
