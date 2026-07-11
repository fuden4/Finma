"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PosterWithStats } from "@/db/types";

interface PosterRowProps {
  title: string;
  posters: PosterWithStats[];
  seeAllHref?: string;
  onOpen: (poster: PosterWithStats) => void;
}

export function PosterRow({
  title,
  posters,
  seeAllHref,
  onOpen,
}: PosterRowProps) {
  if (posters.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      {seeAllHref ? (
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
        {posters.map((poster, index) => (
          <motion.button
            key={poster.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            onClick={() => onOpen(poster)}
            className="group w-[140px] shrink-0 text-left sm:w-[160px] md:w-[180px] touch-manipulation"
            aria-label={`View ${poster.title}`}
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-finema-surface shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster.image_url}
                alt={poster.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            </div>
            <p className="mt-2 text-sm font-medium text-finema-text line-clamp-2 group-hover:text-finema-accent transition-colors">
              {poster.title}
            </p>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
