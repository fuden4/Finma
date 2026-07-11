"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";

interface VideoControlsProps {
  isVisible: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  playbackRate: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeek: (value: number) => void;
  onSkip: (delta: number) => void;
  onToggleFullscreen: () => void;
  onChangeRate: (rate: number) => void;
  onToggleMute: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number, useHours: boolean): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (useHours || hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${mins}:${pad(secs)}`;
}

function SkipBackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 md:w-11 md:h-11" fill="currentColor">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
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

function SkipForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 md:w-11 md:h-11" fill="currentColor">
      <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
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

export function VideoControls({
  isVisible,
  isPlaying,
  currentTime,
  duration,
  isFullscreen,
  playbackRate,
  muted,
  onTogglePlay,
  onSeek,
  onSkip,
  onToggleFullscreen,
  onChangeRate,
  onToggleMute,
}: VideoControlsProps) {
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);
  const backControls = useAnimationControls();
  const forwardControls = useAnimationControls();
  const useHours = duration >= 3600;
  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  useEffect(() => {
    if (!speedOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setSpeedOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [speedOpen]);

  const visibility = {
    opacity: isVisible ? 1 : 0,
  };
  const transportBtn = isVisible ? "pointer-events-auto" : "pointer-events-none";

  return (
    <>
      {/* Centered transport controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={visibility}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-10 flex items-center justify-center gap-5 sm:gap-8 md:gap-12 pointer-events-none px-4"
      >
        <motion.button
          type="button"
          onClick={() => {
            onSkip(-10);
            backControls.start({ rotate: [0, -45, 0] });
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`${transportBtn} flex items-center justify-center min-h-[48px] min-w-[48px] text-white/90 hover:text-white touch-manipulation`}
          aria-label="Rewind 10 seconds"
        >
          <motion.span
            animate={backControls}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="inline-block"
          >
            <SkipBackIcon />
          </motion.span>
        </motion.button>

        <motion.button
          type="button"
          onClick={onTogglePlay}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`${transportBtn} flex items-center justify-center min-h-[56px] min-w-[56px] text-white/90 hover:text-white touch-manipulation`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <span className="relative block w-14 h-14 sm:w-12 sm:h-12 md:w-14 md:h-14">
            <AnimatePresence initial={false}>
              {isPlaying ? (
                <motion.svg
                  key="pause"
                  viewBox="0 0 24 24"
                  className="absolute inset-0 w-full h-full fill-current"
                  initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="play"
                  viewBox="0 0 24 24"
                  className="absolute inset-0 w-full h-full fill-current"
                  initial={{ opacity: 0, scale: 0.4, rotate: 90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4, rotate: -90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <path d="M8 5v14l11-7z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => {
            onSkip(10);
            forwardControls.start({ rotate: [0, 45, 0] });
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`${transportBtn} flex items-center justify-center min-h-[48px] min-w-[48px] text-white/90 hover:text-white touch-manipulation`}
          aria-label="Forward 10 seconds"
        >
          <motion.span
            animate={forwardControls}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="inline-block"
          >
            <SkipForwardIcon />
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Bottom bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-0 bottom-0 z-20 px-3 sm:px-4 md:px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-6 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto"
      >
        {/* Progress row */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <span className="text-xs md:text-sm text-white/90 tabular-nums shrink-0 min-w-[2.75rem] sm:min-w-[3.5rem]">
            {formatTime(currentTime, useHours)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #e50914 0%, #e50914 ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%, rgba(255,255,255,0.3) 100%)`,
            }}
            className="flex-1 h-1.5 sm:h-1 accent-finema-accent cursor-pointer appearance-none rounded-full touch-manipulation [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 sm:[&::-webkit-slider-thumb]:w-3 sm:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 sm:[&::-moz-range-thumb]:w-3 sm:[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
          />
          <span className="text-xs md:text-sm text-white/90 tabular-nums shrink-0 min-w-[2.75rem] sm:min-w-[3.5rem] text-right">
            {formatTime(duration, useHours)}
          </span>
        </div>

        {/* Control row */}
        <div className="flex items-center justify-between">
          <motion.button
            type="button"
            onClick={onToggleMute}
            whileTap={{ scale: 0.8 }}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] text-white/90 hover:text-white transition-colors touch-manipulation"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </motion.button>

          <div className="flex items-center gap-4 md:gap-6">
            <div ref={speedRef} className="relative">
              <motion.button
                type="button"
                onClick={() => setSpeedOpen((open) => !open)}
                whileTap={{ scale: 0.85 }}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-xs md:text-sm text-white/90 hover:text-white transition-colors tabular-nums touch-manipulation"
                aria-label="Playback speed"
              >
                {playbackRate === 1 ? "1x" : `${playbackRate}x`}
              </motion.button>
              {speedOpen && (
                <div className="absolute bottom-full right-0 mb-2 py-1 rounded bg-black/90 border border-white/20 min-w-[4rem]">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        onChangeRate(rate);
                        setSpeedOpen(false);
                      }}
                      className={`block w-full px-4 py-1.5 text-sm text-left hover:bg-white/10 transition-colors ${
                        playbackRate === rate ? "text-white font-medium" : "text-white/70"
                      }`}
                    >
                      {rate === 1 ? "Normal" : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <motion.button
              type="button"
              onClick={onToggleFullscreen}
              whileTap={{ scale: 0.8 }}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] text-white/90 hover:text-white transition-colors touch-manipulation"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
