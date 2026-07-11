"use client";

import Link from "next/link";
import type { SongWithStats } from "@/db/types";
import { songPath } from "@/lib/content-paths";

interface SongCardProps {
  song: SongWithStats;
  variant?: "row" | "grid";
}

export function SongCard({ song, variant = "grid" }: SongCardProps) {
  return (
    <Link
      href={songPath(song)}
      className={`group block overflow-hidden rounded-xl border border-white/10 bg-finema-surface/40 transition-colors hover:border-white/25 touch-manipulation ${
        variant === "row" ? "w-40 shrink-0 md:w-48" : ""
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-finema-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={song.cover_url}
          alt={song.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-finema-text line-clamp-1 group-hover:text-finema-accent transition-colors">
          {song.title}
        </h3>
        {song.artist && (
          <p className="text-xs text-finema-muted mt-0.5 line-clamp-1">
            {song.artist}
          </p>
        )}
        {song.description && variant === "grid" && (
          <p className="text-xs text-finema-muted mt-1 line-clamp-2">
            {song.description}
          </p>
        )}
      </div>
    </Link>
  );
}
