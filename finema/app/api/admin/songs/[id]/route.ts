import { NextResponse } from "next/server";
import {
  deleteSong,
  getSongById,
  updateSong,
} from "@/db/queries";
import {
  parseSongFormData,
  processSongAudioUpload,
  resolveSongCoverUrl,
} from "@/lib/audio-upload";
import { requireAdmin } from "@/lib/auth";
import { assertUuid, handleRouteError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 600;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "song id");
    const song = await getSongById(id);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }
    return NextResponse.json({ song });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "song id");

    const existing = await getSongById(id);
    if (!existing) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const parsed = parseSongFormData(formData);
    const cover_url = await resolveSongCoverUrl(
      { ...parsed, cover_url: parsed.cover_url || existing.cover_url },
      parsed.title
    );

    let audio_url = existing.audio_url;
    let download_url = existing.download_url;
    let duration_seconds = existing.duration_seconds;
    let source_lufs = existing.source_lufs;

    if (parsed.audio_file) {
      const audio = await processSongAudioUpload(parsed.audio_file, parsed.title);
      audio_url = audio.audio_url;
      download_url = audio.download_url;
      duration_seconds = audio.duration_seconds;
      source_lufs = audio.source_lufs;
    }

    const song = await updateSong(id, {
      title: parsed.title,
      description: parsed.description,
      artist: parsed.artist,
      cover_url,
      audio_url,
      download_url,
      duration_seconds,
      source_lufs,
      category_id: parsed.category_id,
    });

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    return NextResponse.json({ song });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    assertUuid(id, "song id");
    const deleted = await deleteSong(id);
    if (!deleted) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
