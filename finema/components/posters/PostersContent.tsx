"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { PosterWithStats, PublicUser } from "@/db/types";
import { getMe, getPosters } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { PosterCard } from "./PosterCard";
import { PosterDetailModal } from "./PosterDetailModal";

type SortMode = "newest" | "most_liked";

export function PostersContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [posters, setPosters] = useState<PosterWithStats[]>([]);
  const [sort, setSort] = useState<SortMode>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);

  const loadPosters = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ posters: list }, me] = await Promise.all([getPosters(), getMe()]);
      setPosters(list);
      setUser(me?.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posters");
      setPosters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosters();
  }, [loadPosters]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      setSelectedPosterId(openId);
    }
  }, [searchParams]);

  const sortedPosters = useMemo(() => {
    const next = [...posters];
    if (sort === "most_liked") {
      next.sort((a, b) => {
        if (b.like_count !== a.like_count) {
          return b.like_count - a.like_count;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }
    return next;
  }, [posters, sort]);

  const selectedPoster = useMemo(
    () => posters.find((poster) => poster.id === selectedPosterId) ?? null,
    [posters, selectedPosterId]
  );

  function handleLikeChange(
    posterId: string,
    likeCount: number,
    likedByMe: boolean
  ) {
    setPosters((prev) =>
      prev.map((poster) =>
        poster.id === posterId
          ? { ...poster, like_count: likeCount, liked_by_me: likedByMe }
          : poster
      )
    );
  }

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-24 px-4 md:px-8 pb-16 max-w-[1920px] mx-auto"
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-finema-text mb-2">Posters</h1>
            <p className="text-finema-muted">
              Browse and download cinematic posters. Sign in to like your
              favorites.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSort("newest")}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                sort === "newest"
                  ? "bg-finema-accent text-white"
                  : "border border-white/10 text-finema-muted hover:text-finema-text"
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSort("most_liked")}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                sort === "most_liked"
                  ? "bg-finema-accent text-white"
                  : "border border-white/10 text-finema-muted hover:text-finema-text"
              }`}
            >
              Most liked
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : sortedPosters.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/50 p-12 text-center">
            <p className="text-finema-muted">No posters available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sortedPosters.map((poster, index) => (
              <motion.div
                key={poster.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <PosterCard
                  poster={poster}
                  user={user}
                  onLikeChange={handleLikeChange}
                  onOpen={(item) => setSelectedPosterId(item.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.main>

      <PosterDetailModal
        poster={selectedPoster}
        open={selectedPoster !== null}
        user={user}
        onClose={() => setSelectedPosterId(null)}
        onLikeChange={handleLikeChange}
      />
    </div>
  );
}
