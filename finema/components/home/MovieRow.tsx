"use client";

import { motion } from "framer-motion";
import type { Movie, PublicUser } from "@/db/types";
import { MovieCard } from "./MovieCard";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  showProgress?: Record<string, number>;
  user?: PublicUser | null;
  watchlistIds?: Set<string>;
  showWatchlistButton?: boolean;
  onWatchlistChange?: (movieId: string, inWatchlist: boolean) => void;
}

export function MovieRow({
  title,
  movies,
  showProgress,
  user,
  watchlistIds,
  showWatchlistButton = false,
  onWatchlistChange,
}: MovieRowProps) {
  if (movies.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <h2 className="text-lg md:text-xl font-semibold text-finema-text mb-4 px-4 md:px-8">
        {title}
      </h2>
      <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2">
        {movies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            index={index}
            showProgress={showProgress?.[movie.id]}
            user={user}
            inWatchlist={watchlistIds?.has(movie.id) ?? false}
            showWatchlistButton={showWatchlistButton && !!user}
            onWatchlistChange={(inList) =>
              onWatchlistChange?.(movie.id, inList)
            }
          />
        ))}
      </div>
    </motion.section>
  );
}
