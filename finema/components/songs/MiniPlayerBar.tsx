"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  formatPlaybackTime,
  useMusicPlayer,
} from "@/components/songs/MusicPlayerProvider";

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v14.72a1 1 0 001.5.86l11.04-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 15l7-7 7 7"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function MiniPlayerBar() {
  const {
    track,
    view,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    maximize,
    stop,
  } = useMusicPlayer();

  const visible = Boolean(track && view === "minimized");
  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <AnimatePresence>
      {visible && track ? (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed bottom-0 inset-x-0 z-[80] border-t border-white/10 bg-[#121212]/95 backdrop-blur-md shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
        >
          <div
            className="h-0.5 bg-white/10"
            aria-hidden
          >
            <div
              className="h-full bg-[#1ed760] transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mx-auto flex max-w-[1920px] items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
            <button
              type="button"
              onClick={maximize}
              className="flex min-w-0 flex-1 items-center gap-3 text-left touch-manipulation"
              aria-label={`Open ${track.title}`}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-finema-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={track.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-finema-text">
                  {track.title}
                </p>
                {track.artist ? (
                  <p className="truncate text-xs text-finema-muted">
                    {track.artist}
                  </p>
                ) : (
                  <p className="text-xs text-finema-muted tabular-nums">
                    {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
                  </p>
                )}
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full text-finema-text transition-colors hover:bg-white/10"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={maximize}
                className="flex h-10 w-10 items-center justify-center rounded-full text-finema-muted transition-colors hover:bg-white/10 hover:text-finema-text"
                aria-label="Open full player"
              >
                <MaximizeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={stop}
                className="flex h-10 w-10 items-center justify-center rounded-full text-finema-muted transition-colors hover:bg-white/10 hover:text-finema-text"
                aria-label="Close player"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
