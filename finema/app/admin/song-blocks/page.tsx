"use client";

import { useEffect, useState } from "react";
import type { AdminSong, AdminSongBlock } from "@/db/types";
import {
  createAdminSongBlock,
  deleteAdminSongBlock,
  getAdminSongBlocks,
  getAdminSongs,
  updateAdminSongBlock,
} from "@/lib/api-client";
import { SongBlockCard } from "@/components/songs/SongBlockCard";

function BlockPreview({
  title,
  description,
  selectedSongIds,
  songs,
}: {
  title: string;
  description: string;
  selectedSongIds: string[];
  songs: AdminSong[];
}) {
  const previewSongs = selectedSongIds
    .slice(0, 4)
    .map((id) => songs.find((song) => song.id === id))
    .filter((song): song is AdminSong => Boolean(song))
    .map((song) => ({
      id: song.id,
      cover_url: song.cover_url,
      title: song.title,
    }));

  return (
    <div className="max-w-[200px]">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-finema-muted">
        Card preview (first 4 songs)
      </p>
      <SongBlockCard
        interactive={false}
        block={{
          id: "preview",
          title: title.trim() || "Block title",
          description: description.trim() || null,
          songs: previewSongs,
          song_count: selectedSongIds.length,
        }}
      />
    </div>
  );
}

function SongPicker({
  songs,
  selectedSongIds,
  onChange,
}: {
  songs: AdminSong[];
  selectedSongIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggleSong(id: string) {
    onChange(
      selectedSongIds.includes(id)
        ? selectedSongIds.filter((songId) => songId !== id)
        : [...selectedSongIds, id]
    );
  }

  function moveSong(id: string, direction: -1 | 1) {
    const index = selectedSongIds.indexOf(id);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedSongIds.length) return;
    const next = [...selectedSongIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 p-3 space-y-2">
        <p className="text-xs font-medium text-finema-muted mb-2">All songs</p>
        {songs.map((song) => (
          <label key={song.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedSongIds.includes(song.id)}
              onChange={() => toggleSong(song.id)}
            />
            <span className="line-clamp-1">{song.title}</span>
          </label>
        ))}
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 p-3 space-y-2">
        <p className="text-xs font-medium text-finema-muted mb-2">
          Block order (first 4 show on card)
        </p>
        {selectedSongIds.length === 0 ? (
          <p className="text-sm text-finema-muted">No songs selected.</p>
        ) : (
          selectedSongIds.map((id, index) => {
            const song = songs.find((item) => item.id === id);
            if (!song) return null;
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-2 rounded-md bg-finema-surface px-2 py-1.5 text-sm"
              >
                <span className="line-clamp-1">
                  {index + 1}. {song.title}
                  {index < 4 ? (
                    <span className="ml-2 text-xs text-finema-accent">preview</span>
                  ) : null}
                </span>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => moveSong(id, -1)}
                    disabled={index === 0}
                    className="rounded px-1.5 py-0.5 text-xs text-finema-muted hover:text-finema-text disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSong(id, 1)}
                    disabled={index === selectedSongIds.length - 1}
                    className="rounded px-1.5 py-0.5 text-xs text-finema-muted hover:text-finema-text disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AdminSongBlocksPage() {
  const [blocks, setBlocks] = useState<AdminSongBlock[]>([]);
  const [songs, setSongs] = useState<AdminSong[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isEditing = editingId !== null;

  function load() {
    setLoading(true);
    Promise.all([getAdminSongBlocks(), getAdminSongs()])
      .then(([blocksRes, songsRes]) => {
        setBlocks(blocksRes.blocks);
        setSongs(songsRes.songs);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setSelectedSongIds([]);
    setEditingId(null);
  }

  function startEdit(block: AdminSongBlock) {
    setEditingId(block.id);
    setTitle(block.title);
    setDescription(block.description ?? "");
    setSelectedSongIds(block.song_ids);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        layout: "grid" as const,
        song_ids: selectedSongIds,
      };
      if (editingId) {
        await updateAdminSongBlock(editingId, payload);
      } else {
        await createAdminSongBlock(payload);
      }
      resetForm();
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this block?")) return;
    try {
      await deleteAdminSongBlock(id);
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Song Blocks</h2>
      <p className="mb-6 text-sm text-finema-muted max-w-2xl">
        Each block appears as one card with a 2×2 cover grid (first 4 songs). Clicking
        the card opens a page with every song in the block.
      </p>

      <form onSubmit={handleSubmit} className="mb-10 max-w-4xl space-y-4 rounded-xl border border-white/10 bg-finema-surface/30 p-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-4">
            <h3 className="text-lg font-medium">
              {isEditing ? "Edit block" : "Create block"}
            </h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Block title"
              className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5"
            />
            <SongPicker
              songs={songs}
              selectedSongIds={selectedSongIds}
              onChange={setSelectedSongIds}
            />
          </div>

          <BlockPreview
            title={title}
            description={description}
            selectedSongIds={selectedSongIds}
            songs={songs}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-finema-accent text-white text-sm hover:bg-red-600"
          >
            {isEditing ? "Save changes" : "Create block"}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-white/10 text-sm text-finema-muted hover:text-finema-text"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
        </div>
      ) : blocks.length === 0 ? (
        <p className="text-finema-muted">No blocks yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {blocks.map((block) => (
            <div key={block.id} className="space-y-3">
              <SongBlockCard
                interactive={false}
                block={{
                  id: block.id,
                  title: block.title,
                  description: block.description,
                  songs: block.preview_songs,
                  song_count: block.song_count,
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(block)}
                  className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/30"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(block.id)}
                  className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
