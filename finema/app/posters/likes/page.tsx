"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { PosterWithStats, PublicUser } from "@/db/types";
import { getLikedPosters, getMe } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { PosterCard } from "@/components/posters/PosterCard";
import { PosterDetailModal } from "@/components/posters/PosterDetailModal";

export default function LikedPostersPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [posters, setPosters] = useState<PosterWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(async (me) => {
        setUser(me?.user ?? null);
        if (!me?.user) {
          window.location.href = "/login?redirect=/posters/likes";
          return;
        }
        const res = await getLikedPosters();
        setPosters(res.posters);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load likes")
      )
      .finally(() => setLoading(false));
  }, []);

  const selectedPoster = useMemo(
    () => posters.find((poster) => poster.id === selectedPosterId) ?? null,
    [posters, selectedPosterId]
  );

  function handleLikeChange(
    posterId: string,
    likeCount: number,
    likedByMe: boolean
  ) {
    if (!likedByMe) {
      setPosters((prev) => prev.filter((poster) => poster.id !== posterId));
      if (selectedPosterId === posterId) {
        setSelectedPosterId(null);
      }
      return;
    }
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
        className="pt-24 px-4 md:px-8 pb-16 max-w-[1920px] mx-auto"
      >
        <Link href="/profile" className="text-sm text-finema-muted hover:text-finema-text">
          ← Back to Account
        </Link>
        <Link
          href="/posters"
          className="ml-4 text-sm text-finema-muted hover:text-finema-text"
        >
          Browse Posters
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-finema-text">Liked Posters</h1>
        <p className="mt-2 text-sm text-finema-muted">
          Posters you&apos;ve liked and saved.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <p className="mt-6 text-red-300">{error}</p>
        ) : posters.length === 0 ? (
          <p className="mt-6 text-finema-muted">
            You haven&apos;t liked any posters yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {posters.map((poster, index) => (
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
