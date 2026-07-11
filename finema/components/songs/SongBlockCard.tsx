"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export interface SongBlockCardPreview {
  id: string;
  title: string;
  description?: string | null;
  songs: Array<{ id: string; cover_url: string; title: string }>;
  song_count?: number;
  like_count?: number;
  liked_by_me?: boolean;
}

interface SongBlockCardProps {
  block: SongBlockCardPreview;
  index?: number;
  interactive?: boolean;
  showLike?: boolean;
  liking?: boolean;
  onLikeToggle?: () => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${filled ? "text-finema-accent" : "text-white/80"}`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

export function SongBlockCard({
  block,
  index = 0,
  interactive = true,
  showLike = false,
  liking = false,
  onLikeToggle,
}: SongBlockCardProps) {
  const previewSlots = Array.from({ length: 4 }, (_, i) => block.songs[i] ?? null);
  const totalCount = block.song_count ?? block.songs.length;
  const likeCount = block.like_count ?? 0;

  const content = (
    <>
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 bg-black/40 p-0.5">
        {previewSlots.map((song, slot) => (
          <div
            key={slot}
            className="relative aspect-square overflow-hidden bg-finema-surface"
          >
            {song ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={song.cover_url}
                  alt=""
                  loading="lazy"
                  className={`h-full w-full object-cover ${
                    interactive
                      ? "transition-transform duration-300 group-hover:scale-105"
                      : ""
                  }`}
                />
                {interactive ? (
                  <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                ) : null}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-finema-surface/80">
                <div className="h-8 w-8 rounded-full bg-white/5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3">
        <h3
          className={`font-semibold text-finema-text line-clamp-2 ${
            interactive ? "group-hover:text-finema-accent transition-colors" : ""
          }`}
        >
          {block.title}
        </h3>
        {block.description ? (
          <p className="mt-1 text-xs text-finema-muted line-clamp-2">
            {block.description}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-finema-muted">
            {totalCount} {totalCount === 1 ? "song" : "songs"}
          </p>
          {likeCount > 0 ? (
            <p className="text-xs text-finema-muted">{likeCount} likes</p>
          ) : null}
        </div>
      </div>
    </>
  );

  const wrapperClass =
    "overflow-hidden rounded-xl border border-white/10 bg-finema-surface/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="relative"
    >
      {interactive ? (
        <Link
          href={`/songs/blocks/${block.id}`}
          className={`group block ${wrapperClass} transition-colors hover:border-white/25 hover:bg-finema-surface/60 touch-manipulation`}
        >
          {content}
        </Link>
      ) : (
        <div className={wrapperClass}>{content}</div>
      )}

      {showLike && onLikeToggle ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLikeToggle();
          }}
          disabled={liking}
          aria-label={block.liked_by_me ? "Unlike collection" : "Like collection"}
          className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-50"
        >
          <motion.span
            key={block.liked_by_me ? "liked" : "unliked"}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 16 }}
          >
            <HeartIcon filled={Boolean(block.liked_by_me)} />
          </motion.span>
        </button>
      ) : null}
    </motion.div>
  );
}
