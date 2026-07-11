"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import type { AdminPoster } from "@/db/types";
import { deleteAdminPoster } from "@/lib/api-client";

interface PosterTableProps {
  posters: AdminPoster[];
  onDeleted: () => void;
}

export function PosterTable({ posters, onDeleted }: PosterTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(poster: AdminPoster) {
    if (!confirm(`Delete "${poster.title}"? This cannot be undone.`)) return;
    setDeletingId(poster.id);
    try {
      await deleteAdminPoster(poster.id);
      onDeleted();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (posters.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-12 text-center">
        <p className="text-finema-muted mb-4">No posters yet.</p>
        <Link
          href="/admin/posters/new"
          className="inline-block px-4 py-2 rounded-lg bg-finema-accent text-white hover:bg-red-600 transition-colors"
        >
          Add your first poster
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
              <th className="px-4 py-3 font-medium">Preview</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Likes</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posters.map((poster, index) => (
              <motion.tr
                key={poster.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-white/5 hover:bg-finema-surface-hover/50"
              >
                <td className="px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={poster.image_url}
                    alt=""
                    className="h-16 w-11 rounded object-cover bg-finema-surface"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{poster.title}</td>
                <td className="px-4 py-3 text-finema-muted">
                  {poster.like_count}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/posters/${poster.id}/edit`}
                    className="text-finema-accent hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(poster)}
                    disabled={deletingId === poster.id}
                    className="text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === poster.id ? "Deleting…" : "Delete"}
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
