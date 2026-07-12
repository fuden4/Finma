"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import type { AdminSong } from "@/db/types";
import { deleteAdminSong } from "@/lib/api-client";
import { formatDuration } from "@/lib/movie-utils";
import {
  formatSourceLufs,
  formatVolumeAdjustmentDb,
} from "@/lib/song-loudness";

interface SongTableProps {
  songs: AdminSong[];
  onDeleted: () => void;
}

export function SongTable({ songs, onDeleted }: SongTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(song: AdminSong) {
    if (!confirm(`Delete "${song.title}"? This cannot be undone.`)) return;
    setDeletingId(song.id);
    try {
      await deleteAdminSong(song.id);
      onDeleted();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (songs.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-12 text-center">
        <p className="text-finema-muted mb-4">No songs yet.</p>
        <Link
          href="/admin/songs/new"
          className="inline-block px-4 py-2 rounded-lg bg-finema-accent text-white hover:bg-red-600 transition-colors"
        >
          Add your first song
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-white/10 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-finema-surface/80 text-left text-finema-muted">
              <th className="px-4 py-3 font-medium">Cover</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Artist</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Source LUFS</th>
              <th className="px-4 py-3 font-medium">Adj. (dB)</th>
              <th className="px-4 py-3 font-medium">Likes</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, index) => (
              <motion.tr
                key={song.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-white/5 hover:bg-finema-surface-hover/50"
              >
                <td className="px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={song.cover_url}
                    alt=""
                    className="h-12 w-12 rounded object-cover bg-finema-surface"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{song.title}</td>
                <td className="px-4 py-3 text-finema-muted">
                  {song.artist ?? "—"}
                </td>
                <td className="px-4 py-3 text-finema-muted">
                  {formatDuration(song.duration_seconds)}
                </td>
                <td className="px-4 py-3 text-finema-muted tabular-nums">
                  {formatSourceLufs(song.source_lufs)}
                </td>
                <td className="px-4 py-3 text-finema-muted tabular-nums">
                  {formatVolumeAdjustmentDb(
                    song.volume_adjustment_db,
                    song.source_lufs
                  )}
                </td>
                <td className="px-4 py-3 text-finema-muted">{song.like_count}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/songs/${song.id}/edit`}
                    className="text-finema-accent hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(song)}
                    disabled={deletingId === song.id}
                    className="text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === song.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
