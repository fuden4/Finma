import { NextResponse } from "next/server";
import { createSong, listAdminSongs } from "@/db/queries";
import {
  parseSongFormData,
  processSongAudioUpload,
  resolveSongCoverUrl,
} from "@/lib/audio-upload";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 600;

export async function GET() {
  try {
    await requireAdmin();
    const songs = await listAdminSongs();
    return NextResponse.json({ songs });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const parsed = parseSongFormData(formData);

    if (!parsed.audio_file) {
      return NextResponse.json(
        { error: "Audio file is required (WAV, MP3, or M4A)" },
        { status: 400 }
      );
    }

    const cover_url = await resolveSongCoverUrl(parsed, parsed.title);
    const audio = await processSongAudioUpload(parsed.audio_file, parsed.title);

    const song = await createSong({
      title: parsed.title,
      description: parsed.description,
      artist: parsed.artist,
      cover_url,
      audio_url: audio.audio_url,
      download_url: audio.download_url,
      duration_seconds: audio.duration_seconds,
      category_id: parsed.category_id,
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
