"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SearchContentType, SearchResultItem } from "@/db/types";
import { searchCatalog } from "@/lib/api-client";
import { movieGradient } from "@/lib/movie-utils";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: SearchResultItem) => void | Promise<void>;
}

type TypeFilter = "all" | SearchContentType;

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "series", label: "Series" },
];

const RATING_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Any rating" },
  { value: 3, label: "3+ stars" },
  { value: 4, label: "4+ stars" },
  { value: 5, label: "5 stars" },
];

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

export function SearchModal({ open, onClose, onSelect }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [yearFilter, setYearFilter] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const parsedYear = useMemo(() => {
    const trimmed = yearFilter.trim();
    if (!trimmed) return null;
    const year = Number.parseInt(trimmed, 10);
    return Number.isFinite(year) ? year : null;
  }, [yearFilter]);

  const hasAppliedFilters =
    typeFilter !== "all" || parsedYear !== null || minRating !== null;

  const hasActiveFilters =
    query.trim().length > 0 || parsedYear !== null || minRating !== null;

  useEffect(() => {
    if (!open) {
      setQuery("");
      setTypeFilter("all");
      setYearFilter("");
      setMinRating(null);
      setFiltersOpen(false);
      setResults([]);
      setLoading(false);
      setActiveIndex(0);
      return;
    }

    let cancelled = false;

    if (!hasActiveFilters) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCatalog({
          q: query.trim(),
          type: typeFilter,
          year: parsedYear,
          minRating,
        });
        if (!cancelled) {
          setResults(data.results);
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
  }, [open, query, typeFilter, parsedYear, minRating, hasActiveFilters]);

  const activeItem = useMemo(
    () => results[activeIndex],
    [results, activeIndex]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!open) return;

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) =>
          Math.min(prev + 1, Math.max(results.length - 1, 0))
        );
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

      if (event.key === "Enter" && activeItem) {
        event.preventDefault();
        void onSelect(activeItem);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onSelect, activeItem, results.length]);

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
            className="mx-auto mt-10 w-full max-w-2xl rounded-xl border border-white/10 bg-finema-surface/95 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 px-4 py-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search movies and series..."
                  className="min-w-0 flex-1 bg-transparent text-finema-text placeholder:text-finema-muted outline-none"
                />
                <button
                  type="button"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  aria-expanded={filtersOpen}
                  className={`inline-flex items-center gap-1.5 flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtersOpen || hasAppliedFilters
                      ? "border-finema-accent/50 bg-finema-accent/15 text-finema-text"
                      : "border-white/10 bg-white/5 text-finema-muted hover:text-finema-text hover:border-white/20"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filter
                  {hasAppliedFilters && (
                    <span className="h-1.5 w-1.5 rounded-full bg-finema-accent" />
                  )}
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${
                      filtersOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              <AnimatePresence initial={false}>
                {filtersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div>
                        <p className="mb-2 text-xs font-medium text-finema-muted uppercase tracking-wide">
                          Type
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {TYPE_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setTypeFilter(option.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                typeFilter === option.id
                                  ? "bg-finema-accent text-white"
                                  : "bg-white/5 text-finema-muted hover:text-finema-text border border-white/10"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="search-year-filter"
                            className="mb-2 block text-xs font-medium text-finema-muted uppercase tracking-wide"
                          >
                            Year
                          </label>
                          <input
                            id="search-year-filter"
                            type="number"
                            min={1900}
                            max={2100}
                            value={yearFilter}
                            onChange={(event) =>
                              setYearFilter(event.target.value)
                            }
                            placeholder="e.g. 2024"
                            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-finema-text placeholder:text-finema-muted focus:outline-none focus:border-finema-accent/50"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="search-rating-filter"
                            className="mb-2 block text-xs font-medium text-finema-muted uppercase tracking-wide"
                          >
                            Rating
                          </label>
                          <select
                            id="search-rating-filter"
                            value={minRating ?? ""}
                            onChange={(event) => {
                              const value = event.target.value;
                              setMinRating(
                                value ? Number.parseInt(value, 10) : null
                              );
                            }}
                            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-finema-text focus:outline-none focus:border-finema-accent/50"
                          >
                            {RATING_OPTIONS.map((option) => (
                              <option
                                key={option.label}
                                value={option.value ?? ""}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {hasAppliedFilters && (
                        <button
                          type="button"
                          onClick={() => {
                            setTypeFilter("all");
                            setYearFilter("");
                            setMinRating(null);
                          }}
                          className="text-xs text-finema-muted hover:text-finema-text transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-finema-muted">
                Press / to open, Enter to select
              </p>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {loading ? (
                <p className="px-3 py-4 text-sm text-finema-muted">
                  Searching...
                </p>
              ) : !hasActiveFilters ? (
                <p className="px-3 py-4 text-sm text-finema-muted">
                  Type a title or use filters to search movies and series.
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-4 text-sm text-finema-muted">
                  No results found.
                </p>
              ) : (
                <ul className="space-y-1">
                  {results.map((item, index) => (
                    <li key={`${item.type}-${item.id}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => void onSelect(item)}
                        className={`flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          index === activeIndex
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <div
                          className="h-24 w-16 sm:h-28 sm:w-[4.5rem] flex-shrink-0 rounded-md overflow-hidden shadow-md ring-1 ring-white/10 relative"
                          style={{ background: movieGradient(item.title) }}
                        >
                          {item.poster_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.poster_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span
                            className={`absolute top-1 left-1 z-10 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                              item.type === "series"
                                ? "bg-finema-accent/90 text-white"
                                : "bg-black/70 text-white"
                            }`}
                          >
                            {item.type === "series" ? "Series" : "Movie"}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-finema-text truncate">
                            {item.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {item.avg_rating != null && item.avg_rating > 0 ? (
                              <StarRatingDisplay
                                value={item.avg_rating}
                                count={item.rating_count}
                                size="sm"
                              />
                            ) : (
                              <span className="text-xs text-finema-muted">
                                No rating
                              </span>
                            )}
                            {item.release_year != null && (
                              <>
                                <span className="text-xs text-finema-muted">
                                  ·
                                </span>
                                <span className="text-xs text-finema-muted">
                                  {item.release_year}
                                </span>
                              </>
                            )}
                            {item.type === "series" &&
                              item.episode_count != null &&
                              item.episode_count > 0 && (
                                <>
                                  <span className="text-xs text-finema-muted">
                                    ·
                                  </span>
                                  <span className="text-xs text-finema-muted">
                                    {item.episode_count} episodes
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
