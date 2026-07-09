"use client";

import { motion } from "framer-motion";
import type { PublicUser, WatchlistItem } from "@/db/types";
import { MovieCard } from "./MovieCard";

interface WatchlistRowProps {
  items: WatchlistItem[];
  user: PublicUser | null;
  onWatchlistChange?: (movieId: string, inWatchlist: boolean) => void;
}

export function WatchlistRow({
  items,
  user,
  onWatchlistChange,
}: WatchlistRowProps) {
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <h2 className="text-lg md:text-xl font-semibold text-finema-text mb-4 px-4 md:px-8">
        My List
      </h2>
      <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2">
        {items.map((item, index) => (
          <MovieCard
            key={item.id}
            movie={item}
            index={index}
            user={user}
            inWatchlist
            showWatchlistButton={!!user}
            onWatchlistChange={(inList) =>
              onWatchlistChange?.(item.id, inList)
            }
          />
        ))}
      </div>
    </motion.section>
  );
}
