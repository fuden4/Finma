"use client";

import { motion } from "framer-motion";
import type { PublicUser, Series } from "@/db/types";
import { SeriesCard } from "./SeriesCard";

interface SeriesRowProps {
  title: string;
  series: Series[];
  user?: PublicUser | null;
  watchlistIds?: Set<string>;
  showWatchlistButton?: boolean;
  onWatchlistChange?: (seriesId: string, inWatchlist: boolean) => void;
}

export function SeriesRow({
  title,
  series,
  user,
  watchlistIds,
  showWatchlistButton = false,
  onWatchlistChange,
}: SeriesRowProps) {
  if (series.length === 0) return null;

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
        {series.map((item, index) => (
          <SeriesCard
            key={item.id}
            series={item}
            index={index}
            user={user}
            inWatchlist={watchlistIds?.has(item.id) ?? false}
            showWatchlistButton={showWatchlistButton && !!user}
            onWatchlistChange={(inList) =>
              onWatchlistChange?.(item.id, inList)
            }
          />
        ))}
      </div>
    </motion.section>
  );
}
