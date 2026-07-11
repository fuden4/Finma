"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminSong } from "@/db/types";
import { SongTable } from "@/components/admin/SongTable";
import { getAdminSongs } from "@/lib/api-client";

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<AdminSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadSongs() {
    setLoading(true);
    getAdminSongs()
      .then(({ songs: list }) => setSongs(list))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load songs")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSongs();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Songs</h2>
        <Link
          href="/admin/songs/new"
          className="px-4 py-2 rounded-lg bg-finema-accent text-white text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Add Song
        </Link>
      </div>
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-4">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <SongTable songs={songs} onDeleted={loadSongs} />
      )}
    </div>
  );
}
