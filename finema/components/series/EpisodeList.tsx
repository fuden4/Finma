"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Episode } from "@/db/types";
import { formatDuration } from "@/lib/movie-utils";

interface EpisodeListProps {
  episodes: Episode[];
  seriesPosterUrl?: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function EpisodeList({ episodes, seriesPosterUrl }: EpisodeListProps) {
  const seasons = useMemo(() => {
    const map = new Map<number, Episode[]>();
    for (const ep of episodes) {
      const list = map.get(ep.season_number) ?? [];
      list.push(ep);
      map.set(ep.season_number, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [episodes]);

  const [openSeasons, setOpenSeasons] = useState<Set<number>>(
    () => new Set(seasons.map(([n]) => n))
  );

  if (episodes.length === 0) {
    return (
      <p className="text-finema-muted text-center py-8">
        No episodes available yet. Check back soon.
      </p>
    );
  }

  function toggleSeason(season: number) {
    setOpenSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(season)) {
        next.delete(season);
      } else {
        next.add(season);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {seasons.map(([seasonNumber, seasonEpisodes], seasonIndex) => {
        const isOpen = openSeasons.has(seasonNumber);
        return (
          <motion.div
            key={seasonNumber}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: seasonIndex * 0.08 }}
            className="rounded-xl border border-white/10 bg-finema-surface/40 overflow-hidden backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => toggleSeason(seasonNumber)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-finema-accent">
                  Season {seasonNumber}
                </span>
                <span className="text-sm text-finema-muted">
                  {seasonEpisodes.length} episode
                  {seasonEpisodes.length !== 1 ? "s" : ""}
                </span>
              </div>
              <motion.svg
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="w-5 h-5 text-finema-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </motion.svg>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.06 } },
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-5 pb-5"
                  >
                    {seasonEpisodes.map((episode) => (
                      <motion.div
                        key={episode.id}
                        variants={fadeUp}
                        transition={{ duration: 0.4 }}
                      >
                        <Link href={`/watch/episode/${episode.id}`}>
                          <motion.div
                            whileHover={{
                              scale: 1.02,
                              borderColor: "rgba(229, 9, 20, 0.6)",
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative flex gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-colors cursor-pointer"
                          >
                            <div className="relative w-24 shrink-0 aspect-video rounded overflow-hidden bg-black/40">
                              {(episode.thumbnail_url ?? seriesPosterUrl) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={episode.thumbnail_url ?? seriesPosterUrl ?? ""}
                                  alt={episode.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-finema-accent/30 to-black/60" />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-9 h-9 rounded-full bg-finema-accent flex items-center justify-center shadow-lg">
                                  <svg
                                    className="w-4 h-4 text-white ml-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-finema-accent/90 text-white mb-1.5">
                                S{episode.season_number} E{episode.episode_number}
                              </span>
                              <p className="text-sm font-semibold text-finema-text line-clamp-2 group-hover:text-white transition-colors">
                                {episode.title}
                              </p>
                              <p className="text-xs text-finema-muted mt-1">
                                {formatDuration(episode.duration_seconds)}
                              </p>
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
