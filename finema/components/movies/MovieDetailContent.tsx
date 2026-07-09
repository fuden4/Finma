"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Movie, MovieDetail, PublicUser } from "@/db/types";
import { formatDuration, movieGradient } from "@/lib/movie-utils";
import { isRegularUser } from "@/lib/user-utils";
import { MovieRow } from "@/components/home/MovieRow";
import { MovieComments } from "@/components/movies/MovieComments";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";
import { StarRatingInput } from "@/components/ratings/StarRatingInput";

interface MovieDetailContentProps {
  movie: MovieDetail;
  recommendations: Movie[];
  user: PublicUser | null;
  inWatchlist: boolean;
  watchlistIds?: string[];
  userRating: number | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function MovieDetailContent({
  movie,
  recommendations,
  user,
  inWatchlist,
  watchlistIds,
  userRating,
}: MovieDetailContentProps) {
  const [avgRating, setAvgRating] = useState(movie.avg_rating ?? null);
  const [ratingCount, setRatingCount] = useState(movie.rating_count ?? 0);
  const [currentUserRating, setCurrentUserRating] = useState(userRating);

  const gradient = movieGradient(movie.title);
  const heroImage = movie.backdrop_url ?? movie.poster_url;
  const regularUser = isRegularUser(user) ? user : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-finema-bg"
    >
      <section className="relative min-h-[58vh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute inset-0"
          style={{ background: gradient }}
        >
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
          )}
        </motion.div>
        <motion.div
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_#e50914_0%,_transparent_45%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-finema-bg via-black/20 to-transparent" />

        <div className="relative z-10 px-4 md:px-8 pt-6 pb-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded bg-black/50 border border-white/20 text-finema-text hover:bg-black/70 hover:border-white/40 transition-colors mb-10"
            >
              <span aria-hidden>←</span> Back to Browse
            </Link>
          </motion.div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6 md:gap-8">
            {movie.poster_url && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="w-40 md:w-52 shrink-0 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )}

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
              }}
            >
              {movie.match_score !== null && (
              <motion.span
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="inline-block text-sm font-semibold px-3 py-1 rounded bg-finema-success text-white mb-4"
              >
                {Math.round(movie.match_score)}% Match
              </motion.span>
            )}

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.55 }}
              className="text-4xl md:text-6xl font-bold text-finema-text mb-4"
            >
              {movie.title}
            </motion.h1>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center gap-3 text-sm text-finema-muted mb-8"
            >
              {movie.release_year && <span>{movie.release_year}</span>}
              <span>{formatDuration(movie.duration_seconds)}</span>
              {movie.quality_label && (
                <span className="px-2 py-0.5 rounded bg-white/10">
                  {movie.quality_label}
                </span>
              )}
              {movie.genres.map((genre, index) => (
                <motion.span
                  key={genre}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  className="px-2 py-0.5 rounded bg-white/10 text-finema-text"
                >
                  {genre}
                </motion.span>
              ))}
              <StarRatingDisplay
                value={avgRating}
                count={ratingCount}
                size="sm"
                showEmpty
              />
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap gap-3">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={`/watch/${movie.id}`}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors shadow-lg shadow-finema-accent/30"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </Link>
                </motion.div>
                {regularUser && (
                  <WatchlistButton
                    movieId={movie.id}
                    initialInWatchlist={inWatchlist}
                    variant="detail"
                    user={regularUser}
                  />
                )}
              </div>
            </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55 }}
        className="px-4 md:px-8 pb-10 max-w-3xl mx-auto"
      >
        <h2 className="text-lg font-semibold text-finema-text mb-3">
          About this movie
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-finema-muted leading-relaxed text-base md:text-lg"
        >
          {movie.description ?? "No description available."}
        </motion.p>

        {regularUser && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-base font-semibold text-finema-text mb-3">
              Rate this movie
            </h3>
            <StarRatingInput
              movieId={movie.id}
              initialRating={userRating}
              user={regularUser}
              onRated={(stats) => {
                setAvgRating(stats.avg_rating);
                setRatingCount(stats.rating_count);
                setCurrentUserRating(stats.user_rating);
              }}
            />
          </div>
        )}
      </motion.section>

      <MovieComments
        movieId={movie.id}
        user={user}
        currentUserRating={currentUserRating}
      />

      {recommendations.length > 0 && (
        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="border-t border-white/10 bg-finema-surface/30 pt-8 pb-16"
        >
          <MovieRow
            title="More Like This"
            movies={recommendations}
            user={regularUser}
            watchlistIds={watchlistIds ? new Set(watchlistIds) : undefined}
            showWatchlistButton={!!regularUser}
          />
        </motion.footer>
      )}
    </motion.div>
  );
}
