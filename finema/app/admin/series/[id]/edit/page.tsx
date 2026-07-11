"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SeriesDetail } from "@/db/types";
import { SeriesForm } from "@/components/admin/SeriesForm";
import { deleteAdminEpisode, getAdminSeriesById } from "@/lib/api-client";
import { formatDuration } from "@/lib/movie-utils";

interface EditSeriesPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSeriesPage({ params }: EditSeriesPageProps) {
  const router = useRouter();
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    params.then(async ({ id }) => {
      try {
        const { series: data } = await getAdminSeriesById(id);
        if (!cancelled) setSeries(data);
      } catch {
        if (!cancelled) setSeries(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  async function handleDeleteEpisode(episodeId: string, title: string) {
    if (!confirm(`Delete episode "${title}"?`)) return;
    setDeletingId(episodeId);
    try {
      await deleteAdminEpisode(episodeId);
      if (series) {
        const { series: updated } = await getAdminSeriesById(series.id);
        setSeries(updated);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="text-center py-12 text-finema-muted">
        Series not found.{" "}
        <button
          type="button"
          onClick={() => router.push("/admin/series")}
          className="text-finema-accent hover:underline"
        >
          Back to series list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold mb-6">Edit Series</h2>
        <SeriesForm mode="edit" series={series} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Episodes</h3>
          <a
            href="/admin/series/new"
            className="text-sm text-finema-accent hover:underline"
          >
            Add new episode
          </a>
        </div>
        {series.episodes.length === 0 ? (
          <p className="text-finema-muted text-sm">No episodes yet.</p>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-finema-surface/80 text-left text-finema-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {series.episodes.map((ep) => (
                  <tr
                    key={ep.id}
                    className="border-b border-white/5 hover:bg-finema-surface-hover/50"
                  >
                    <td className="px-4 py-3 text-finema-muted">
                      S{ep.season_number} E{ep.episode_number}
                    </td>
                    <td className="px-4 py-3 font-medium">{ep.title}</td>
                    <td className="px-4 py-3 text-finema-muted">
                      {formatDuration(ep.duration_seconds)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                        disabled={deletingId === ep.id}
                        className="text-red-400 hover:underline disabled:opacity-50"
                      >
                        {deletingId === ep.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
