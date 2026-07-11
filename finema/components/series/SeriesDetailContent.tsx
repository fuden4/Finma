"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import type { PublicUser, Series, SeriesDetail } from "@/db/types";
import { movieGradient } from "@/lib/movie-utils";
import { isRegularUser } from "@/lib/user-utils";
import { EpisodeList } from "@/components/series/EpisodeList";
import { SeriesComments } from "@/components/series/SeriesComments";
import { SeriesWatchlistButton } from "@/components/series/SeriesWatchlistButton";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";
import { SeriesStarRatingInput } from "@/components/series/SeriesStarRatingInput";

interface SeriesDetailContentProps {
  series: SeriesDetail;
  recommendations: Series[];
  user: PublicUser | null;
  inWatchlist: boolean;
  seriesWatchlistIds?: string[];
  userRating: number | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function SeriesDetailContent({
  series,
  recommendations,
  user,
  inWatchlist,
  userRating,
}: SeriesDetailContentProps) {
  const [avgRating, setAvgRating] = useState(series.avg_rating ?? null);
  const [ratingCount, setRatingCount] = useState(series.rating_count ?? 0);
  const [currentUserRating, setCurrentUserRating] = useState(userRating);

  const gradient = movieGradient(series.title);
  const heroImage = series.backdrop_url ?? series.poster_url;
  const regularUser = isRegularUser(user) ? user : null;
  const firstEpisode = series.episodes[0] ?? null;
  const episodeLabel = firstEpisode
    ? `Play S${firstEpisode.season_number} E${firstEpisode.episode_number}`
    : null;

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
              alt={series.title}
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
            {series.poster_url && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="w-40 md:w-52 shrink-0 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={series.poster_url}
                  alt={series.title}
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
              <motion.span
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded bg-white/10 text-finema-accent mb-3"
              >
                TV Series
              </motion.span>

              {series.match_score !== null && (
                <motion.span
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="inline-block text-sm font-semibold px-3 py-1 rounded bg-finema-success text-white mb-4 ml-2"
                >
                  {Math.round(series.match_score)}% Match
                </motion.span>
              )}

              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.55 }}
                className="text-4xl md:text-6xl font-bold text-finema-text mb-4"
              >
                {series.title}
              </motion.h1>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="flex flex-wrap items-center gap-3 text-sm text-finema-muted mb-8"
              >
                {series.release_year && <span>{series.release_year}</span>}
                {series.episode_count != null && series.episode_count > 0 && (
                  <span>
                    {series.episode_count} episode
                    {series.episode_count !== 1 ? "s" : ""}
                  </span>
                )}
                {series.genres.map((genre, index) => (
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
                  {firstEpisode && (
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        href={`/watch/episode/${firstEpisode.id}`}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors shadow-lg shadow-finema-accent/30"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        {episodeLabel}
                      </Link>
                    </motion.div>
                  )}
                  {regularUser && (
                    <SeriesWatchlistButton
                      seriesId={series.id}
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
          About this series
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-finema-muted leading-relaxed text-base md:text-lg"
        >
          {series.description ?? "No description available."}
        </motion.p>

        {regularUser && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-base font-semibold text-finema-text mb-3">
              Rate this series
            </h3>
            <SeriesStarRatingInput
              seriesId={series.id}
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

      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-8 pb-12 max-w-5xl mx-auto"
      >
        <h2 className="text-xl font-semibold text-finema-text mb-6">Episodes</h2>
        <EpisodeList
          episodes={series.episodes}
          seriesPosterUrl={series.poster_url}
        />
      </motion.section>

      <SeriesComments
        seriesId={series.id}
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
          <div className="mb-10">
            <h2 className="text-lg md:text-xl font-semibold text-finema-text mb-4 px-4 md:px-8">
              More Series Like This
            </h2>
            <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2">
              {recommendations.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/series/${item.id}`}
                  className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="relative aspect-[2/3] rounded-md overflow-hidden shadow-lg"
                    style={{ background: movieGradient(item.title) }}
                  >
                    {item.poster_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </motion.div>
                  <p className="mt-2 text-sm font-medium text-finema-text truncate">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </motion.footer>
      )}
    </motion.div>
  );
}
