"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Movie } from "@/db/types";
import { searchMovies } from "@/lib/api-client";
import { movieGradient } from "@/lib/movie-utils";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMovie: (movieId: string) => void | Promise<void>;
}

export function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function SearchModal({ open, onClose, onSelectMovie }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    const trimmed = query.trim();

    if (trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchMovies(trimmed);
        if (!cancelled) {
          setResults(data.movies);
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, query]);

  const activeMovie = useMemo(() => results[activeIndex], [results, activeIndex]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!open) return;

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, Math.max(results.length - 1, 0)));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (event.key === "Enter" && !isTextInput(event.target)) {
        return;
      }

      if (event.key === "Enter" && activeMovie) {
        event.preventDefault();
        void onSelectMovie(activeMovie.id);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onSelectMovie, activeMovie, results.length]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mx-auto mt-16 w-full max-w-2xl rounded-xl border border-white/10 bg-finema-surface/95 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 px-4 py-3">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search movies..."
                className="w-full bg-transparent text-finema-text placeholder:text-finema-muted outline-none"
              />
              <p className="mt-1 text-xs text-finema-muted">Press / to open, Enter to select</p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading ? (
                <p className="px-3 py-4 text-sm text-finema-muted">Searching...</p>
              ) : query.trim().length === 0 ? (
                <p className="px-3 py-4 text-sm text-finema-muted">Type a movie title to search.</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-4 text-sm text-finema-muted">No movies found.</p>
              ) : (
                <ul className="space-y-1">
                  {results.map((movie, index) => (
                    <li key={movie.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => void onSelectMovie(movie.id)}
                        className={`flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          index === activeIndex
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <div
                          className="h-24 w-16 sm:h-28 sm:w-[4.5rem] flex-shrink-0 rounded-md overflow-hidden shadow-md ring-1 ring-white/10"
                          style={{ background: movieGradient(movie.title) }}
                        >
                          {movie.poster_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={movie.poster_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-finema-text truncate">
                            {movie.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {movie.avg_rating != null && movie.avg_rating > 0 ? (
                              <StarRatingDisplay
                                value={movie.avg_rating}
                                count={movie.rating_count}
                                size="sm"
                              />
                            ) : (
                              <span className="text-xs text-finema-muted">No rating</span>
                            )}
                            {movie.release_year != null && (
                              <>
                                <span className="text-xs text-finema-muted">·</span>
                                <span className="text-xs text-finema-muted">
                                  {movie.release_year}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
