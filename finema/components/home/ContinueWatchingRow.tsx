"use client";

import { motion } from "framer-motion";
import type { ContinueWatchingItem } from "@/db/types";
import { MovieCard } from "./MovieCard";

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
}

export function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10 -mt-8 relative z-20"
    >
      <h2 className="text-lg md:text-xl font-semibold text-finema-text mb-4 px-4 md:px-8">
        Continue Watching
      </h2>
      <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2">
        {items.map((item, index) => (
          <MovieCard
            key={item.id}
            movie={{
              id: item.id,
              slug: item.slug,
              title: item.title,
              description: item.description,
              release_year: item.release_year,
              duration_seconds: item.duration_seconds,
              poster_url: item.poster_url,
              backdrop_url: item.backdrop_url,
              match_score: item.match_score,
              genres: [],
            }}
            index={index}
            showProgress={item.progress_seconds}
          />
        ))}
      </div>
    </motion.section>
  );
}
