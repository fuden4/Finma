"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AdminSong } from "@/db/types";
import { SongForm } from "@/components/admin/SongForm";
import { getAdminSong } from "@/lib/api-client";

export default function EditSongPage() {
  const params = useParams<{ id: string }>();
  const [song, setSong] = useState<AdminSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    getAdminSong(params.id)
      .then(({ song: data }) => setSong(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load song")
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error || "Song not found"}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Edit Song</h2>
      <SongForm mode="edit" song={song} />
    </div>
  );
}
