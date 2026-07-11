"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PublicUser, Series } from "@/db/types";
import { movieGradient } from "@/lib/movie-utils";
import { isRegularUser } from "@/lib/user-utils";
import { SeriesWatchlistButton } from "@/components/series/SeriesWatchlistButton";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";

interface SeriesCardProps {
  series: Series;
  index?: number;
  user?: PublicUser | null;
  inWatchlist?: boolean;
  showWatchlistButton?: boolean;
  onWatchlistChange?: (inWatchlist: boolean) => void;
}

export function SeriesCard({
  series,
  index = 0,
  user,
  inWatchlist = false,
  showWatchlistButton = false,
  onWatchlistChange,
}: SeriesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
    >
      <Link href={`/series/${series.id}`}>
        <motion.div
          whileHover={{ scale: 1.05, y: -4 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-[2/3] rounded-md overflow-hidden group cursor-pointer shadow-lg"
          style={{ background: movieGradient(series.title) }}
        >
          {series.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={series.poster_url}
              alt={series.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-finema-accent/90 text-white">
            Series
          </span>

          {series.episode_count != null && series.episode_count > 0 && (
            <span className="absolute bottom-2 left-2 z-10 text-xs font-medium px-2 py-0.5 rounded bg-black/70 text-white">
              {series.episode_count} ep
            </span>
          )}

          {series.match_score !== null && !showWatchlistButton && (
            <span className="absolute top-2 right-2 z-10 text-xs font-semibold px-2 py-0.5 rounded bg-finema-success/90 text-white">
              {Math.round(series.match_score)}% Match
            </span>
          )}

          {showWatchlistButton && isRegularUser(user) && (
            <SeriesWatchlistButton
              seriesId={series.id}
              initialInWatchlist={inWatchlist}
              variant="card"
              user={user}
              onChange={onWatchlistChange}
            />
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <div className="w-12 h-12 rounded-full bg-finema-accent flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </motion.div>
      </Link>

      <Link href={`/series/${series.id}`}>
        <p className="mt-2 text-sm font-medium text-finema-text truncate hover:text-finema-accent transition-colors">
          {series.title}
        </p>
      </Link>
      {series.release_year && (
        <p className="text-xs text-finema-muted">{series.release_year}</p>
      )}
      {series.avg_rating != null && series.avg_rating > 0 && (
        <div className="mt-1">
          <StarRatingDisplay value={series.avg_rating} size="sm" />
        </div>
      )}
    </motion.div>
  );
}
