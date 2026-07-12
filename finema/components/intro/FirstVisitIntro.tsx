"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { markIntroSeen } from "@/lib/intro";

interface FirstVisitIntroProps {
  onComplete: () => void;
}

export function FirstVisitIntro({ onComplete }: FirstVisitIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dismissing, setDismissing] = useState(false);
  const [muted, setMuted] = useState(true);

  const finish = useCallback(() => {
    if (dismissing) return;
    setDismissing(true);
    markIntroSeen();
  }, [dismissing]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!dismissing && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
        >
          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
            onEnded={finish}
            onError={finish}
          />

          <div className="absolute top-0 right-0 flex items-center gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label={muted ? "Unmute intro" : "Mute intro"}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              onClick={finish}
              className="rounded-full border border-white/20 bg-black/50 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
