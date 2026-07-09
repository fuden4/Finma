"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Movie, PublicUser } from "@/db/types";
import { movieGradient } from "@/lib/movie-utils";
import { isRegularUser } from "@/lib/user-utils";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";

interface MovieCardProps {
  movie: Movie;
  index?: number;
  showProgress?: number;
  layout?: "row" | "grid";
  user?: PublicUser | null;
  inWatchlist?: boolean;
  showWatchlistButton?: boolean;
  onWatchlistChange?: (inWatchlist: boolean) => void;
}

export function MovieCard({
  movie,
  index = 0,
  showProgress,
  layout = "row",
  user,
  inWatchlist = false,
  showWatchlistButton = false,
  onWatchlistChange,
}: MovieCardProps) {
  const progressPercent =
    showProgress !== undefined
      ? Math.min(100, (showProgress / movie.duration_seconds) * 100)
      : undefined;

  const widthClass =
    layout === "grid"
      ? "w-full"
      : "flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={widthClass}
    >
      <Link href={`/movies/${movie.id}`}>
        <motion.div
          whileHover={{ scale: 1.05, y: -4 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-[2/3] rounded-md overflow-hidden group cursor-pointer shadow-lg"
          style={{ background: movieGradient(movie.title) }}
        >
          {movie.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.poster_url}
              alt={movie.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {movie.match_score !== null && !showProgress && (
            <span className="absolute top-2 left-2 z-10 text-xs font-semibold px-2 py-0.5 rounded bg-finema-success/90 text-white">
              {Math.round(movie.match_score)}% Match
            </span>
          )}

          {showWatchlistButton && isRegularUser(user) && (
            <WatchlistButton
              movieId={movie.id}
              initialInWatchlist={inWatchlist}
              variant="card"
              user={user}
              onChange={onWatchlistChange}
            />
          )}

          <div className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/80 via-transparent to-transparent">
            <p className="text-xs font-medium text-white line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {movie.title}
            </p>
          </div>

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

          {progressPercent !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className="h-full bg-finema-accent"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </motion.div>
      </Link>

      <Link href={`/movies/${movie.id}`}>
        <p className="mt-2 text-sm font-medium text-finema-text truncate hover:text-finema-accent transition-colors">
          {movie.title}
        </p>
      </Link>
      {movie.release_year && (
        <p className="text-xs text-finema-muted">{movie.release_year}</p>
      )}
      {movie.avg_rating != null && movie.avg_rating > 0 && (
        <div className="mt-1">
          <StarRatingDisplay value={movie.avg_rating} size="sm" />
        </div>
      )}
    </motion.div>
  );
}
