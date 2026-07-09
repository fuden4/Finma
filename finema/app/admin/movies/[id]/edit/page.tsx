"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AdminMovie } from "@/db/types";
import { MovieForm } from "@/components/admin/MovieForm";
import { getAdminMovie } from "@/lib/api-client";

export default function EditMoviePage() {
  const params = useParams<{ id: string }>();
  const [movie, setMovie] = useState<AdminMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    getAdminMovie(params.id)
      .then(({ movie: data }) => setMovie(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load movie")
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

  if (error || !movie) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error || "Movie not found"}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Edit Movie</h2>
      <MovieForm mode="edit" movie={movie} />
    </div>
  );
}
