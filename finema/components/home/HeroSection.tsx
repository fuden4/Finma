"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Movie, PublicUser } from "@/db/types";
import { movieGradient } from "@/lib/movie-utils";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";

const AUTOPLAY_INTERVAL = 6000;
const FADE_DURATION = 0.6;
const SWIPE_THRESHOLD = 50;

interface HeroSectionProps {
  movies: Movie[];
  user?: PublicUser | null;
  watchlistIds?: Set<string>;
  onWatchlistChange?: (movieId: string, inWatchlist: boolean) => void;
}

function HeroSlide({
  movie,
  user,
  inWatchlist,
  onWatchlistChange,
}: {
  movie: Movie;
  user?: PublicUser | null;
  inWatchlist: boolean;
  onWatchlistChange?: (inWatchlist: boolean) => void;
}) {
  const gradient = movieGradient(movie.title);
  const heroImage = movie.backdrop_url ?? movie.poster_url;

  return (
    <>
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
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
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-finema-bg via-transparent to-black/30" />

      <div className="relative z-10 flex flex-col justify-end h-full px-4 md:px-8 pb-20 sm:pb-16 md:pb-24 pt-16 sm:pt-14 max-w-3xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {movie.match_score !== null && (
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="inline-block text-sm font-semibold px-3 py-1 rounded bg-finema-success text-white mb-4"
            >
              {Math.round(movie.match_score)}% Match
            </motion.span>
          )}

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
            className="text-3xl sm:text-4xl md:text-6xl font-bold text-finema-text leading-tight mb-3"
          >
            {movie.title}
          </motion.h1>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            className="flex flex-wrap gap-2 text-sm text-finema-muted mb-4"
          >
            {movie.release_year && <span>{movie.release_year}</span>}
            {movie.avg_rating != null && movie.avg_rating > 0 && (
              <StarRatingDisplay
                value={movie.avg_rating}
                count={movie.rating_count}
                size="sm"
              />
            )}
            {movie.genres.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded bg-white/10">
                {g}
              </span>
            ))}
          </motion.div>

          {movie.description && (
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="text-finema-muted text-sm md:text-base line-clamp-3 mb-6 max-w-xl"
            >
              {movie.description}
            </motion.p>
          )}

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            className="flex flex-wrap gap-2 sm:gap-3"
          >
            <Link
              href={`/watch/${movie.id}`}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded bg-finema-accent text-white text-sm sm:text-base font-semibold hover:bg-finema-accent/90 transition-colors touch-manipulation"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </Link>
            <WatchlistButton
              movieId={movie.id}
              initialInWatchlist={inWatchlist}
              variant="detail"
              user={user}
              onChange={onWatchlistChange}
            />
            <Link
              href={`/movies/${movie.id}`}
              className="px-4 sm:px-6 py-2.5 rounded bg-white/20 text-white text-sm sm:text-base font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm touch-manipulation"
            >
              More Info
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

export function HeroSection({
  movies,
  user,
  watchlistIds = new Set(),
  onWatchlistChange,
}: HeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const isSlider = movies.length > 1;
  const movie = movies[current];

  const goTo = useCallback(
    (index: number) => {
      if (!isSlider) return;
      setCurrent(((index % movies.length) + movies.length) % movies.length);
    },
    [isSlider, movies.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (!isSlider || paused) return;
    const timer = window.setInterval(next, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [isSlider, paused, next]);

  if (!movie) return null;

  return (
    <section
      className="group relative h-[58vh] min-h-[380px] sm:h-[70vh] sm:min-h-[480px] max-h-[800px] w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION, ease: "easeInOut" }}
          className="absolute inset-0"
          drag={isSlider ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (!isSlider) return;
            if (info.offset.x < -SWIPE_THRESHOLD) next();
            else if (info.offset.x > SWIPE_THRESHOLD) prev();
          }}
        >
          <HeroSlide
            movie={movie}
            user={user}
            inWatchlist={watchlistIds.has(movie.id)}
            onWatchlistChange={(inList) =>
              onWatchlistChange?.(movie.id, inList)
            }
          />
        </motion.div>
      </AnimatePresence>

      {isSlider && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-black/70"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-black/70"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 sm:bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {movies.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
