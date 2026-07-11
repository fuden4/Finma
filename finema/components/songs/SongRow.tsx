"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { SongWithStats } from "@/db/types";
import { SongCard } from "./SongCard";

interface SongRowProps {
  title: string;
  songs: SongWithStats[];
  blockId?: string;
  seeAllHref?: string;
}

export function SongRow({ title, songs, blockId, seeAllHref }: SongRowProps) {
  if (songs.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      {blockId ? (
        <Link
          href={`/songs/blocks/${blockId}`}
          className="inline-block text-lg md:text-xl font-semibold text-finema-text mb-4 px-4 md:px-8 hover:text-finema-accent transition-colors"
        >
          {title}
        </Link>
      ) : seeAllHref ? (
        <Link
          href={seeAllHref}
          className="inline-block text-lg md:text-xl font-semibold text-finema-text mb-4 px-4 md:px-8 hover:text-finema-accent transition-colors"
        >
          {title}
        </Link>
      ) : (
        <h2 className="text-lg md:text-xl font-semibold text-finema-text mb-4 px-4 md:px-8">
          {title}
        </h2>
      )}
      <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} variant="row" />
        ))}
      </div>
    </motion.section>
  );
}
