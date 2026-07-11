"use client";

import Link from "next/link";
import { useState } from "react";
import type { MovieRatingResponse } from "@/lib/api-client";
import { rateSeries, removeSeriesRating } from "@/lib/api-client";
import type { PublicUser } from "@/db/types";

interface SeriesStarRatingInputProps {
  seriesId: string;
  initialRating: number | null;
  user: PublicUser | null;
  onRated?: (stats: MovieRatingResponse) => void;
}

function StarButton({
  index,
  filled,
  hovered,
  disabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  index: number;
  filled: boolean;
  hovered: boolean;
  disabled: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const active = filled || hovered;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`Select ${index} stars`}
      className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
    >
      <svg
        className={`w-7 h-7 ${active ? "text-yellow-400" : "text-white/30"}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    </button>
  );
}

export function SeriesStarRatingInput({
  seriesId,
  initialRating,
  user,
  onRated,
}: SeriesStarRatingInputProps) {
  const [userRating, setUserRating] = useState(initialRating);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <p className="text-finema-muted text-sm">
        <Link href="/login" className="text-finema-accent hover:underline">
          Sign in
        </Link>{" "}
        to rate this series.
      </p>
    );
  }

  const displayRating = hovered ?? pendingRating ?? userRating ?? 0;
  const hasPendingChange =
    pendingRating !== null && pendingRating !== userRating;

  async function handleSubmit() {
    if (pendingRating === null) return;

    setLoading(true);
    setError(null);
    try {
      const stats = await rateSeries(seriesId, pendingRating);
      setUserRating(stats.user_rating);
      setPendingRating(null);
      onRated?.(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rating");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setLoading(true);
    setError(null);
    try {
      const stats = await removeSeriesRating(seriesId);
      setUserRating(null);
      setPendingRating(null);
      onRated?.(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove rating");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const star = i + 1;
            return (
              <StarButton
                key={star}
                index={star}
                filled={star <= displayRating}
                hovered={hovered !== null && star <= hovered}
                disabled={loading}
                onClick={() => setPendingRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !hasPendingChange}
          className="px-5 py-2 rounded font-semibold bg-finema-accent text-white hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>

      {userRating !== null && (
        <p className="text-sm text-finema-muted">Your rating: {userRating}</p>
      )}

      {userRating !== null && (
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="text-xs text-finema-muted hover:text-finema-text transition-colors disabled:opacity-50"
        >
          Clear rating
        </button>
      )}

      {error && (
        <p className="text-sm text-finema-accent" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
