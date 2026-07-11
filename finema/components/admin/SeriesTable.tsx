"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import type { AdminSeries } from "@/db/types";
import { deleteAdminSeries } from "@/lib/api-client";

interface SeriesTableProps {
  series: AdminSeries[];
  onDeleted: () => void;
}

export function SeriesTable({ series, onDeleted }: SeriesTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(item: AdminSeries) {
    if (!confirm(`Delete "${item.title}" and all its episodes? This cannot be undone.`)) {
      return;
    }
    setDeletingId(item.id);
    try {
      await deleteAdminSeries(item.id);
      onDeleted();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (series.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-12 text-center">
        <p className="text-finema-muted mb-4">No series yet.</p>
        <Link
          href="/admin/series/new"
          className="inline-block px-4 py-2 rounded-lg bg-finema-accent text-white hover:bg-red-600 transition-colors"
        >
          Add your first series
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
              <th className="px-4 py-3 font-medium">Episodes</th>
              <th className="px-4 py-3 font-medium">Genres</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {series.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-white/5 hover:bg-finema-surface-hover/50"
              >
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3 text-finema-muted">
                  {item.release_year ?? "—"}
                </td>
                <td className="px-4 py-3 text-finema-muted">
                  {item.episode_count ?? 0}
                </td>
                <td className="px-4 py-3 text-finema-muted">
                  {item.genres.join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/series/${item.id}/edit`}
                    className="text-finema-accent hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === item.id ? "Deleting…" : "Delete"}
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
