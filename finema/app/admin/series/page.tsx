"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminSeries } from "@/db/types";
import { SeriesTable } from "@/components/admin/SeriesTable";
import { getAdminSeries } from "@/lib/api-client";

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<AdminSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadSeries() {
    setLoading(true);
    getAdminSeries()
      .then(({ series: list }) => setSeries(list))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load series")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSeries();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">TV Series</h2>
        <Link
          href="/admin/series/new"
          className="px-4 py-2 rounded-lg bg-finema-accent text-white text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Add Series / Episode
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
        <SeriesTable series={series} onDeleted={loadSeries} />
      )}
    </div>
  );
}
