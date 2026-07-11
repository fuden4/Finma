import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSongById } from "@/db/queries";
import { assertUuid, handleRouteError } from "@/lib/http";
import { slugifyTitle } from "@/lib/slug";

const AUDIO_ROOT = path.join(process.cwd(), "public", "audio");

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    assertUuid(id, "song id");
    const song = await getSongById(id);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const urlPath = song.download_url.replace(/^\/api\/audio\//, "");
    const filePath = path.join(AUDIO_ROOT, urlPath);
    if (!filePath.startsWith(AUDIO_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const data = await readFile(filePath);
    const filename = `${slugifyTitle(song.title) || "song"}.wav`;

    return new NextResponse(data, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
