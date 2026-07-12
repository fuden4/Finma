import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
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

function toWebStream(nodeStream: Readable) {
  return Readable.toWeb(nodeStream);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const filePath = resolveAudioPath(segments);

  if (!filePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
      if (!match) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const end = match[2] ? Number.parseInt(match[2], 10) : fileSize - 1;

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        end >= fileSize ||
        start > end
      ) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const stream = createReadStream(filePath, { start, end });

      return new NextResponse(toWebStream(stream), {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(chunkSize),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const stream = createReadStream(filePath);
    return new NextResponse(toWebStream(stream), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
