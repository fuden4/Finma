"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMusicPlayer } from "@/components/songs/MusicPlayerProvider";

export function SongVolumeControl({ className }: { className?: string }) {
  const { volume, setVolume } = useMusicPlayer();
  const [showVolume, setShowVolume] = useState(false);

  return (
    <div
      className={`relative ${className ?? ""}`}
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      <button
        type="button"
        onClick={() => {
          if (window.matchMedia("(pointer: coarse)").matches) {
            setShowVolume((open) => !open);
            return;
          }
          setVolume(volume > 0 ? 0 : 1);
        }}
        className="rounded-full p-2 text-white/60 transition-colors hover:text-white"
        aria-label={volume > 0 ? "Mute" : "Unmute"}
        aria-expanded={showVolume}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          {volume === 0 ? (
            <path d="M16.5 12a4.5 4.5 0 00-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          ) : (
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          )}
        </svg>
      </button>
      <AnimatePresence>
        {showVolume && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute left-1/2 top-full z-20 mt-2 w-36 -translate-x-1/2 rounded-full bg-[#282828] px-3 py-2 shadow-xl"
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-[#1ed760]"
              aria-label="Volume"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
