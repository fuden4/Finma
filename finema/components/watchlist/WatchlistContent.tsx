"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PublicUser, SeriesWatchlistItem, WatchlistItem } from "@/db/types";
import { getSeriesWatchlist, getWatchlist } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { MovieCard } from "@/components/home/MovieCard";
import { SeriesCard } from "@/components/home/SeriesCard";

interface WatchlistContentProps {
  user: PublicUser;
}

type WatchlistFilter = "all" | "movies" | "series";

const FILTER_TABS: { id: WatchlistFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movies", label: "Movies" },
  { id: "series", label: "Series" },
];

export function WatchlistContent({ user }: WatchlistContentProps) {
  const [movies, setMovies] = useState<WatchlistItem[]>([]);
  const [series, setSeries] = useState<SeriesWatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WatchlistFilter>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [movieResult, seriesResult] = await Promise.all([
          getWatchlist(),
          getSeriesWatchlist(),
        ]);
        if (!cancelled) {
          setMovies(movieResult.items);
          setSeries(seriesResult.items);
        }
      } catch {
        if (!cancelled) {
          setMovies([]);
          setSeries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: movies.length + series.length,
      movies: movies.length,
      series: series.length,
    }),
    [movies.length, series.length]
  );

  const isEmpty = movies.length === 0 && series.length === 0;
  const showMovies = filter === "all" || filter === "movies";
  const showSeries = filter === "all" || filter === "series";

  function handleRemoveMovie(movieId: string) {
    setMovies((prev) => prev.filter((item) => item.id !== movieId));
  }

  function handleRemoveSeries(seriesId: string) {
    setSeries((prev) => prev.filter((item) => item.id !== seriesId));
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
          Movies and series you&apos;ve saved to watch later.
        </p>

        {!loading && !isEmpty && (
          <div className="flex flex-wrap gap-2 mb-8">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === tab.id
                    ? "bg-finema-accent text-white"
                    : "bg-finema-surface/40 text-finema-muted hover:text-finema-text border border-white/10"
                }`}
              >
                {tab.label} ({counts[tab.id]})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
            <p className="text-lg text-finema-text mb-2">Your list is empty</p>
            <p className="text-finema-muted mb-6">
              Browse movies and series and add them to your list.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors"
            >
              Browse home
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {showMovies && movies.length > 0 && (
              <section>
                {filter === "all" && (
                  <h2 className="text-xl font-semibold text-finema-text mb-4">
                    Movies
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <AnimatePresence>
                    {movies.map((movie, index) => (
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
                            if (!inList) handleRemoveMovie(movie.id);
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {showSeries && series.length > 0 && (
              <section>
                {filter === "all" && (
                  <h2 className="text-xl font-semibold text-finema-text mb-4">
                    Series
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <AnimatePresence>
                    {series.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SeriesCard
                          series={item}
                          index={index}
                          layout="grid"
                          user={user}
                          inWatchlist
                          showWatchlistButton
                          onWatchlistChange={(inList) => {
                            if (!inList) handleRemoveSeries(item.id);
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {filter === "movies" && movies.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
                <p className="text-lg text-finema-text mb-2">No movies saved</p>
                <p className="text-finema-muted">
                  Add movies to your list from the home page or movie pages.
                </p>
              </div>
            )}

            {filter === "series" && series.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
                <p className="text-lg text-finema-text mb-2">No series saved</p>
                <p className="text-finema-muted">
                  Add series to your list from the home page or series pages.
                </p>
              </div>
            )}
          </div>
        )}
      </motion.main>
    </div>
  );
}
