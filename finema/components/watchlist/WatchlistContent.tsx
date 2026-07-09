"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PublicUser, WatchlistItem } from "@/db/types";
import { getWatchlist } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { MovieCard } from "@/components/home/MovieCard";

interface WatchlistContentProps {
  user: PublicUser;
}

export function WatchlistContent({ user }: WatchlistContentProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getWatchlist();
        if (!cancelled) setItems(result.items);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleRemove(movieId: string) {
    setItems((prev) => prev.filter((item) => item.id !== movieId));
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
        <h1 className="text-3xl font-bold text-finema-text mb-2">My List</h1>
        <p className="text-finema-muted mb-8">
          Movies you&apos;ve saved to watch later.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
            <p className="text-lg text-finema-text mb-2">Your list is empty</p>
            <p className="text-finema-muted mb-6">
              Browse movies and add them to your list to watch later.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors"
            >
              Browse movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {items.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <MovieCard
                    movie={movie}
                    index={index}
                    layout="grid"
                    user={user}
                    inWatchlist
                    showWatchlistButton
                    onWatchlistChange={(inList) => {
                      if (!inList) handleRemove(movie.id);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.main>
    </div>
  );
}
