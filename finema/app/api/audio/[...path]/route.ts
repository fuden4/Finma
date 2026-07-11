import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const AUDIO_ROOT = path.join(process.cwd(), "public", "audio");

const MIME_TYPES: Record<string, string> = {
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".mp3": "audio/mpeg",
};

function resolveAudioPath(segments: string[]): string | null {
  const relativePath = path.join(...segments);
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return null;
  }
  const filePath = path.join(AUDIO_ROOT, normalized);
  if (!filePath.startsWith(AUDIO_ROOT)) {
    return null;
  }
  return filePath;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const filePath = resolveAudioPath(segments);

  if (!filePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
