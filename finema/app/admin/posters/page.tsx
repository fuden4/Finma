"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminPoster } from "@/db/types";
import { PosterTable } from "@/components/admin/PosterTable";
import { getAdminPosters } from "@/lib/api-client";

export default function AdminPostersPage() {
  const [posters, setPosters] = useState<AdminPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadPosters() {
    setLoading(true);
    getAdminPosters()
      .then(({ posters: list }) => setPosters(list))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load posters")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPosters();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Posters</h2>
        <Link
          href="/admin/posters/new"
          className="px-4 py-2 rounded-lg bg-finema-accent text-white text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Add Poster
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
        <PosterTable posters={posters} onDeleted={loadPosters} />
      )}
    </div>
  );
}
