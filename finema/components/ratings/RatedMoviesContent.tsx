"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PublicUser, RatedMovieItem } from "@/db/types";
import { getRatedMovies } from "@/lib/api-client";
import { moviePath } from "@/lib/content-paths";
import { movieGradient } from "@/lib/movie-utils";
import { Navbar } from "@/components/layout/Navbar";
import { StarRatingDisplay } from "./StarRatingDisplay";
import { StarRatingInput } from "./StarRatingInput";

interface RatedMoviesContentProps {
  user: PublicUser;
}

export function RatedMoviesContent({ user }: RatedMoviesContentProps) {
  const [items, setItems] = useState<RatedMovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getRatedMovies();
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

  function handleRated(
    movieId: string,
    stats: { avg_rating: number | null; rating_count: number; user_rating: number | null }
  ) {
    if (stats.user_rating === null) {
      setItems((prev) => prev.filter((item) => item.id !== movieId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === movieId
          ? {
              ...item,
              user_rating: stats.user_rating!,
              avg_rating: stats.avg_rating,
              rating_count: stats.rating_count,
            }
          : item
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
        <h1 className="text-3xl font-bold text-finema-text mb-2">My Ratings</h1>
        <p className="text-finema-muted mb-8">Movies you&apos;ve rated.</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
            <p className="text-lg text-finema-text mb-2">
              You haven&apos;t rated any movies yet
            </p>
            <p className="text-finema-muted mb-6">
              Browse movies and share your rating.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors"
            >
              Browse movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {items.map((movie, index) => (
                <motion.article
                  key={movie.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="rounded-xl border border-white/10 bg-finema-surface/40 overflow-hidden"
                >
                  <Link href={moviePath(movie)} className="block">
                    <div
                      className="aspect-[2/3] relative"
                      style={{ background: movieGradient(movie.title) }}
                    >
                      {movie.poster_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </Link>
                  <div className="p-4 space-y-3">
                    <Link
                      href={moviePath(movie)}
                      className="text-base font-semibold text-finema-text hover:text-finema-accent transition-colors line-clamp-2"
                    >
                      {movie.title}
                    </Link>
                    <div>
                      <p className="text-xs text-finema-muted mb-1">Your rating</p>
                      <StarRatingDisplay value={movie.user_rating} size="sm" />
                    </div>
                    <div>
                      <p className="text-xs text-finema-muted mb-1">Community</p>
                      <StarRatingDisplay
                        value={movie.avg_rating}
                        count={movie.rating_count}
                        size="sm"
                        showEmpty
                      />
                    </div>
                    <StarRatingInput
                      movieId={movie.id}
                      initialRating={movie.user_rating}
                      user={user}
                      compact
                      onRated={(stats) => handleRated(movie.id, stats)}
                    />
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.main>
    </div>
  );
}
