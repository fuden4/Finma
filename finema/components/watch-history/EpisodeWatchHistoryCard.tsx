"use client";

import Link from "next/link";
import type { EpisodeWatchHistoryItem } from "@/db/types";
import { movieGradient } from "@/lib/movie-utils";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";

interface EpisodeWatchHistoryCardProps {
  item: EpisodeWatchHistoryItem;
}

function formatWatchDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(iso));
}

export function EpisodeWatchHistoryCard({ item }: EpisodeWatchHistoryCardProps) {
  const imageUrl = item.thumbnail_url ?? item.poster_url;
  const progressPercent =
    item.duration_seconds > 0
      ? Math.min(100, (item.progress_seconds / item.duration_seconds) * 100)
      : 0;

  const metadata = item.completed
    ? `Completed · ${formatWatchDate(item.last_watched_at)}`
    : `${Math.round(progressPercent)}% watched · ${formatWatchDate(item.last_watched_at)}`;

  const actionLabel = item.completed ? "Watch again" : "Resume";

  return (
    <article className="rounded-xl border border-white/10 bg-finema-surface/40 overflow-hidden">
      <Link href={`/series/${item.series_id}`} className="block relative">
        <div
          className="aspect-[2/3] relative"
          style={{ background: movieGradient(item.series_title) }}
        >
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={item.series_title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-finema-accent/90 text-white">
            Series
          </span>

          {item.completed ? (
            <span className="absolute top-2 right-2 z-10 text-xs font-semibold px-2 py-0.5 rounded bg-finema-success/90 text-white">
              Completed
            </span>
          ) : (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className="h-full bg-finema-accent"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link
          href={`/series/${item.series_id}`}
          className="text-base font-semibold text-finema-text hover:text-finema-accent transition-colors line-clamp-2"
        >
          {item.series_title}
        </Link>

        <p className="text-sm text-finema-text line-clamp-1">
          S{item.season_number}E{item.episode_number}: {item.title}
        </p>

        <p className="text-xs text-finema-muted">{metadata}</p>

        {item.avg_rating != null && item.avg_rating > 0 && (
          <StarRatingDisplay
            value={item.avg_rating}
            count={item.rating_count}
            size="sm"
          />
        )}

        <Link
          href={`/watch/episode/${item.id}`}
          className="inline-block w-full text-center px-4 py-2 rounded bg-finema-accent text-white text-sm font-semibold hover:bg-finema-accent/90 transition-colors"
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
