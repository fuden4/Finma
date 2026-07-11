"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AdminPoster } from "@/db/types";
import { PosterForm } from "@/components/admin/PosterForm";
import { getAdminPoster } from "@/lib/api-client";

export default function EditPosterPage() {
  const params = useParams<{ id: string }>();
  const [poster, setPoster] = useState<AdminPoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    getAdminPoster(params.id)
      .then(({ poster: data }) => setPoster(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load poster")
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

  if (error || !poster) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error || "Poster not found"}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Edit Poster</h2>
      <PosterForm mode="edit" poster={poster} />
    </div>
  );
}
