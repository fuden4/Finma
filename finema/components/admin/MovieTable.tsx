"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import type { AdminMovie } from "@/db/types";
import { deleteAdminMovie } from "@/lib/api-client";
import { formatDuration } from "@/lib/movie-utils";

interface MovieTableProps {
  movies: AdminMovie[];
  onDeleted: () => void;
}

export function MovieTable({ movies, onDeleted }: MovieTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(movie: AdminMovie) {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;
    setDeletingId(movie.id);
    try {
      await deleteAdminMovie(movie.id);
      onDeleted();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (movies.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-12 text-center">
        <p className="text-finema-muted mb-4">No movies yet.</p>
        <Link
          href="/admin/movies/new"
          className="inline-block px-4 py-2 rounded-lg bg-finema-accent text-white hover:bg-red-600 transition-colors"
        >
          Add your first movie
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
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Genres</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => (
              <motion.tr
                key={movie.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-white/5 hover:bg-finema-surface-hover/50"
              >
                <td className="px-4 py-3 font-medium">{movie.title}</td>
                <td className="px-4 py-3 text-finema-muted">
                  {movie.release_year ?? "—"}
                </td>
                <td className="px-4 py-3 text-finema-muted">
                  {formatDuration(movie.duration_seconds)}
                </td>
                <td className="px-4 py-3 text-finema-muted">
                  {movie.genres.join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/movies/${movie.id}/edit`}
                    className="text-finema-accent hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(movie)}
                    disabled={deletingId === movie.id}
                    className="text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === movie.id ? "Deleting…" : "Delete"}
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
