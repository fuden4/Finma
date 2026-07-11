"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { MovieDetail } from "@/db/types";

interface PlayerOverlayProps {
  movie: MovieDetail;
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;
  isGuest: boolean;
  isPlaying: boolean;
}

export function PlayerOverlay({
  movie,
  isVisible,
  isLoading,
  error,
  isGuest,
  isPlaying,
}: PlayerOverlayProps) {
  const showTapHint = !isLoading && !error && !isPlaying && !isVisible;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)] p-3 sm:p-4 md:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center justify-between gap-3">
          <Link
            href={`/movies/${movie.id}`}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] -ml-2 px-2 text-sm md:text-base text-white/90 hover:text-white transition-colors shrink-0 touch-manipulation"
            aria-label="Back to movie details"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-finema-text truncate text-right max-w-[55vw] sm:max-w-none">
            {movie.title}
          </h1>
        </div>
      </motion.div>

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 pointer-events-none px-4">
          <div className="flex items-center gap-3 text-finema-text text-sm sm:text-base">
            <div className="w-6 h-6 border-2 border-finema-accent border-t-transparent rounded-full animate-spin" />
            <span>Loading stream...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 pointer-events-none px-4">
          <div className="text-center max-w-sm">
            <p className="text-finema-accent text-lg sm:text-xl font-semibold mb-2">
              Video unavailable
            </p>
            <p className="text-finema-muted text-sm sm:text-base">{error}</p>
          </div>
        </div>
      )}

      {showTapHint && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-black/50 border border-white/20 px-5 py-3 text-white/90 text-sm">
            Tap to play
          </div>
        </div>
      )}

      {isGuest && (
        <div className="absolute left-1/2 z-20 -translate-x-1/2 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] sm:bottom-28 px-4 py-2 rounded-full bg-black/70 border border-white/20 text-finema-muted text-xs md:text-sm pointer-events-none max-w-[90vw] text-center">
          Sign in to save your progress
        </div>
      )}
    </>
  );
}
