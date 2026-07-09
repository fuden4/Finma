"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PublicUser, WatchHistoryItem } from "@/db/types";
import { getWatchHistory } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { WatchHistoryCard } from "@/components/watch-history/WatchHistoryCard";

interface WatchHistoryContentProps {
  user: PublicUser;
}

type HistoryFilter = "all" | "in_progress" | "completed";

const FILTER_TABS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

export function WatchHistoryContent({ user }: WatchHistoryContentProps) {
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getWatchHistory();
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

  const counts = useMemo(
    () => ({
      all: items.length,
      in_progress: items.filter((item) => !item.completed).length,
      completed: items.filter((item) => item.completed).length,
    }),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (filter === "in_progress") {
      return items.filter((item) => !item.completed);
    }
    if (filter === "completed") {
      return items.filter((item) => item.completed);
    }
    return items;
  }, [items, filter]);

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
          Movies you&apos;ve started or finished watching.
        </p>

        {!loading && items.length > 0 && (
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
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
            <p className="text-lg text-finema-text mb-2">
              You haven&apos;t watched anything yet
            </p>
            <p className="text-finema-muted mb-6">
              Start watching a movie and it will appear here.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors"
            >
              Browse movies
            </Link>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
            <p className="text-lg text-finema-text mb-2">
              No movies in this category
            </p>
            <p className="text-finema-muted">
              Try another filter to see your watch history.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
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
        )}
      </motion.main>
    </div>
  );
}
