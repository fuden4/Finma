"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PosterWithStats, PublicUser } from "@/db/types";
import { likePoster, unlikePoster } from "@/lib/api-client";
import { slugifyTitle } from "@/lib/slug";

interface PosterCardProps {
  poster: PosterWithStats;
  user: PublicUser | null;
  onLikeChange: (posterId: string, likeCount: number, likedByMe: boolean) => void;
  onOpen: (poster: PosterWithStats) => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-5 w-5 ${filled ? "fill-finema-accent text-finema-accent" : "fill-none"}`}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 11.25 12 15.75m0 0 4.5-4.5M12 15.75V3"
      />
    </svg>
  );
}

export function PosterCard({ poster, user, onLikeChange, onOpen }: PosterCardProps) {
  const [liking, setLiking] = useState(false);
  const downloadName = `${slugifyTitle(poster.title) || "poster"}.jpg`;

  async function handleLikeToggle() {
    if (!user || liking) return;
    setLiking(true);
    const wasLiked = poster.liked_by_me;
    const optimisticCount = wasLiked
      ? Math.max(0, poster.like_count - 1)
      : poster.like_count + 1;
    onLikeChange(poster.id, optimisticCount, !wasLiked);

    try {
      const result = wasLiked
        ? await unlikePoster(poster.id)
        : await likePoster(poster.id);
      onLikeChange(poster.id, result.like_count, result.liked_by_me);
    } catch {
      onLikeChange(poster.id, poster.like_count, poster.liked_by_me);
    } finally {
      setLiking(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-xl border border-white/10 bg-finema-surface/40">
      <button
        type="button"
        onClick={() => onOpen(poster)}
        className="relative block aspect-[2/3] w-full overflow-hidden bg-finema-surface text-left touch-manipulation"
        aria-label={`View details for ${poster.title}`}
      >
        <Image
          src={poster.image_url}
          alt={poster.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => onOpen(poster)}
          className="w-full text-left touch-manipulation"
        >
          <h2 className="font-semibold text-finema-text line-clamp-2 hover:text-finema-accent transition-colors">
            {poster.title}
          </h2>
          {poster.description && (
            <p className="mt-1 text-sm text-finema-muted line-clamp-2">
              {poster.description}
            </p>
          )}
        </button>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => void handleLikeToggle()}
                disabled={liking}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-finema-text hover:border-white/30 transition-colors disabled:opacity-50 touch-manipulation"
                aria-label={poster.liked_by_me ? "Unlike poster" : "Like poster"}
              >
                <HeartIcon filled={poster.liked_by_me} />
                <span>{poster.like_count}</span>
              </button>
            ) : (
              <Link
                href="/login?redirect=/posters"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-finema-muted hover:border-white/30 hover:text-finema-text transition-colors touch-manipulation"
                title="Sign in to like"
              >
                <HeartIcon filled={false} />
                <span>{poster.like_count}</span>
              </Link>
            )}
          </div>

          <a
            href={poster.image_url}
            download={downloadName}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-finema-text hover:border-finema-accent hover:text-finema-accent transition-colors touch-manipulation"
          >
            <DownloadIcon />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>
    </article>
  );
}
