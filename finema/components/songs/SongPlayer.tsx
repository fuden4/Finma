"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  formatPlaybackTime,
  useMusicPlayer,
} from "@/components/songs/MusicPlayerProvider";

interface SongPlayerProps {
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

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

function SkipIcon({
  className,
  direction,
}: {
  className?: string;
  direction: "back" | "forward";
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      {direction === "back" ? (
        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
      ) : (
        <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
      )}
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        10
      </text>
    </svg>
  );
}

function ShuffleIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-5 w-5 ${active ? "text-[#1ed760]" : "text-white/60"}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
  );
}

function RepeatIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-5 w-5 ${active ? "text-[#1ed760]" : "text-white/60"}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
  );
}

export function SongPlayer({
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: SongPlayerProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const {
    track,
    isPlaying,
    currentTime,
    duration,
    repeat,
    shuffle,
    isDragging,
    setRepeat,
    setShuffle,
    setIsDragging,
    togglePlay,
    skip,
    seekByClientX,
    setOnEnded,
  } = useMusicPlayer();

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  useEffect(() => {
    if (!hasNext || !onNext) {
      setOnEnded(null);
      return;
    }
    setOnEnded(onNext);
    return () => setOnEnded(null);
  }, [hasNext, onNext, setOnEnded]);

  const seekAtClientX = useCallback(
    (clientX: number) => {
      const bar = progressRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      seekByClientX(clientX, rect.width, rect.left);
    },
    [seekByClientX]
  );

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, [setIsDragging]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    seekAtClientX(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }
    e.preventDefault();
    seekAtClientX(e.clientX);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    endDrag();
  }

  if (!track) return null;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs font-medium tabular-nums text-white/70">
        <span>{formatPlaybackTime(currentTime)}</span>
        <span>{formatPlaybackTime(duration)}</span>
      </div>

      <div
        ref={progressRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") skip(5);
          if (e.key === "ArrowLeft") skip(-5);
        }}
        className="group relative mb-8 flex h-4 cursor-pointer touch-none select-none items-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="relative h-1.5 w-full rounded-full bg-white/20 group-hover:h-2 transition-[height]">
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-white group-hover:bg-[#1ed760]"
            style={{ width: `${progress}%` }}
            layout={false}
            transition={{ type: "tween", duration: isDragging ? 0 : 0.1 }}
          />
          <motion.div
            className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-md transition-opacity ${
              isDragging ? "opacity-100 scale-125" : "opacity-0 group-hover:opacity-100"
            }`}
            style={{ left: `clamp(0px, calc(${progress}% - 6px), calc(100% - 12px))` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setShuffle(!shuffle)}
          className="rounded-full p-2 transition-colors hover:bg-white/10"
          aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
          aria-pressed={shuffle}
        >
          <ShuffleIcon active={shuffle} />
        </button>

        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="rounded-full p-2 text-white/70 transition-colors hover:text-white disabled:opacity-30"
          aria-label="Previous track"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => skip(-10)}
          className="rounded-full p-1.5 text-white/80 transition-colors hover:text-white"
          aria-label="Skip back 10 seconds"
        >
          <SkipIcon className="h-7 w-7 sm:h-8 sm:w-8" direction="back" />
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-black/40 transition-transform active:scale-95 sm:h-16 sm:w-16"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <PauseIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          ) : (
            <PlayIcon className="ml-0.5 h-7 w-7 sm:h-8 sm:w-8" />
          )}
        </button>

        <button
          type="button"
          onClick={() => skip(10)}
          className="rounded-full p-1.5 text-white/80 transition-colors hover:text-white"
          aria-label="Skip forward 10 seconds"
        >
          <SkipIcon className="h-7 w-7 sm:h-8 sm:w-8" direction="forward" />
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="rounded-full p-2 text-white/70 transition-colors hover:text-white disabled:opacity-30"
          aria-label="Next track"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setRepeat(!repeat)}
          className="rounded-full p-2 transition-colors hover:bg-white/10"
          aria-label={repeat ? "Disable repeat" : "Enable repeat"}
          aria-pressed={repeat}
        >
          <RepeatIcon active={repeat} />
        </button>
      </div>
    </div>
  );
}
