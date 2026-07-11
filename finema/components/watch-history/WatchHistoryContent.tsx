"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  EpisodeWatchHistoryItem,
  PublicUser,
  WatchHistoryItem,
} from "@/db/types";
import { getEpisodeWatchHistory, getWatchHistory } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { WatchHistoryCard } from "@/components/watch-history/WatchHistoryCard";
import { EpisodeWatchHistoryCard } from "@/components/watch-history/EpisodeWatchHistoryCard";

interface WatchHistoryContentProps {
  user: PublicUser;
}

type HistoryFilter = "all" | "movies" | "series";
type ProgressFilter = "all" | "in_progress" | "completed";

const TYPE_TABS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movies", label: "Movies" },
  { id: "series", label: "Series" },
];

const PROGRESS_TABS: { id: ProgressFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

export function WatchHistoryContent({ user }: WatchHistoryContentProps) {
  const [movies, setMovies] = useState<WatchHistoryItem[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeWatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<HistoryFilter>("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [movieResult, episodeResult] = await Promise.all([
          getWatchHistory(),
          getEpisodeWatchHistory(),
        ]);
        if (!cancelled) {
          setMovies(movieResult.items);
          setEpisodes(episodeResult.items);
        }
      } catch {
        if (!cancelled) {
          setMovies([]);
          setEpisodes([]);
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

  const filteredMovies = useMemo(() => {
    if (progressFilter === "in_progress") {
      return movies.filter((item) => !item.completed);
    }
    if (progressFilter === "completed") {
      return movies.filter((item) => item.completed);
    }
    return movies;
  }, [movies, progressFilter]);

  const filteredEpisodes = useMemo(() => {
    if (progressFilter === "in_progress") {
      return episodes.filter((item) => !item.completed);
    }
    if (progressFilter === "completed") {
      return episodes.filter((item) => item.completed);
    }
    return episodes;
  }, [episodes, progressFilter]);

  const counts = useMemo(
    () => ({
      all: movies.length + episodes.length,
      movies: movies.length,
      series: episodes.length,
      in_progress:
        movies.filter((item) => !item.completed).length +
        episodes.filter((item) => !item.completed).length,
      completed:
        movies.filter((item) => item.completed).length +
        episodes.filter((item) => item.completed).length,
    }),
    [movies, episodes]
  );

  const isEmpty = movies.length === 0 && episodes.length === 0;
  const showMovies = typeFilter === "all" || typeFilter === "movies";
  const showSeries = typeFilter === "all" || typeFilter === "series";
  const hasVisibleItems =
    (showMovies && filteredMovies.length > 0) ||
    (showSeries && filteredEpisodes.length > 0);

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-24 px-4 md:px-8 pb-16 max-w-[1920px] mx-auto"
      >
        <h1 className="text-3xl font-bold text-finema-text mb-2">
          Watch History
        </h1>
        <p className="text-finema-muted mb-8">
          Movies and series episodes you&apos;ve started or finished watching.
        </p>

        {!loading && !isEmpty && (
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    typeFilter === tab.id
                      ? "bg-finema-accent text-white"
                      : "bg-finema-surface/40 text-finema-muted hover:text-finema-text border border-white/10"
                  }`}
                >
                  {tab.label} ({counts[tab.id]})
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {PROGRESS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProgressFilter(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    progressFilter === tab.id
                      ? "bg-white/10 text-finema-text border border-white/20"
                      : "bg-finema-surface/40 text-finema-muted hover:text-finema-text border border-white/10"
                  }`}
                >
                  {tab.label} ({counts[tab.id]})
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
            <p className="text-lg text-finema-text mb-2">
              You haven&apos;t watched anything yet
            </p>
            <p className="text-finema-muted mb-6">
              Start watching a movie or series episode and it will appear here.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors"
            >
              Browse home
            </Link>
          </div>
        ) : !hasVisibleItems ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
            <p className="text-lg text-finema-text mb-2">
              Nothing in this category
            </p>
            <p className="text-finema-muted">
              Try another filter to see your watch history.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {showMovies && filteredMovies.length > 0 && (
              <section>
                {typeFilter === "all" && (
                  <h2 className="text-xl font-semibold text-finema-text mb-4">
                    Movies
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {filteredMovies.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                      >
                        <WatchHistoryCard item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {showSeries && filteredEpisodes.length > 0 && (
              <section>
                {typeFilter === "all" && (
                  <h2 className="text-xl font-semibold text-finema-text mb-4">
                    Series
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {filteredEpisodes.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                      >
                        <EpisodeWatchHistoryCard item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </div>
        )}
      </motion.main>
    </div>
  );
}
