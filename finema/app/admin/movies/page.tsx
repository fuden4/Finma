"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminMovie } from "@/db/types";
import { MovieTable } from "@/components/admin/MovieTable";
import { getAdminMovies } from "@/lib/api-client";

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadMovies() {
    setLoading(true);
    getAdminMovies()
      .then(({ movies: list }) => setMovies(list))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load movies")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMovies();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Movies</h2>
        <Link
          href="/admin/movies/new"
          className="px-4 py-2 rounded-lg bg-finema-accent text-white text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Add Movie
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
        <MovieTable movies={movies} onDeleted={loadMovies} />
      )}
    </div>
  );
}
