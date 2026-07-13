"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MovieDetail } from "@/db/types";
import { getMe } from "@/lib/api-client";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useMusicPlayer } from "@/components/songs/MusicPlayerProvider";
import { PlayerOverlay } from "./PlayerOverlay";
import { VideoControls } from "./VideoControls";

interface WatchPlayerProps {
  movie: MovieDetail;
  episodeId?: string;
  backHref?: string;
}

type WatchPhase = "intro" | "fading" | "content";

type WebkitVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
  webkitExitFullscreen?: () => void;
};

function isCoarsePointerDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function WatchPlayer({
  movie,
  episodeId,
  backHref,
}: WatchPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<WatchPhase>("intro");
  const [contentVisible, setContentVisible] = useState(false);
  const [introMuted, setIntroMuted] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const isTouchRef = useRef(false);
  const { stop: stopMusic } = useMusicPlayer();

  const contentReady = phase === "content";
  const hlsEnabled = phase === "fading" || phase === "content";

  const { isLoading, error } = useHlsPlayer({
    videoRef,
    hlsUrl: movie.hls_playlist_url ?? "",
    enabled: hlsEnabled,
  });

  useWatchProgress({
    movieId: episodeId ? undefined : movie.id,
    episodeId,
    videoRef,
    autoPlay: true,
    enabled: contentReady,
  });

  const finishIntro = useCallback(() => {
    setPhase((current) => {
      if (current !== "intro") return current;
      introVideoRef.current?.pause();
      return "fading";
    });
  }, []);

  useEffect(() => {
    isTouchRef.current = isCoarsePointerDevice();
  }, []);

  useEffect(() => {
    let mounted = true;
    getMe().then((me) => {
      if (mounted) setIsGuest(!me?.user);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    stopMusic();
  }, [stopMusic]);

  useEffect(() => {
    if (phase !== "intro") return;
    const video = introVideoRef.current;
    if (!video) return;

    video.muted = false;
    const playUnmuted = async () => {
      try {
        await video.play();
        setIntroMuted(false);
      } catch {
        video.muted = true;
        setIntroMuted(true);
        await video.play().catch(() => {});
      }
    };

    void playUnmuted();
  }, [phase]);

  useEffect(() => {
    if (!contentReady) return;
    const video = videoRef.current;
    if (!video) return;

    const reveal = () => setContentVisible(true);
    if (error || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      reveal();
    } else {
      video.addEventListener("canplay", reveal, { once: true });
      return () => video.removeEventListener("canplay", reveal);
    }
  }, [contentReady, error]);

  useEffect(() => {
    if (!contentReady) return;

    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      stopMusic();
    };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoaded = () => setDuration(video.duration || 0);
    const onVolumeChange = () => {
      setMuted(video.muted);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("volumechange", onVolumeChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, [contentReady, stopMusic]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const video = videoRef.current as WebkitVideoElement | null;
    const onWebkitBegin = () => setIsFullscreen(true);
    const onWebkitEnd = () => setIsFullscreen(false);
    video?.addEventListener("webkitbeginfullscreen", onWebkitBegin);
    video?.addEventListener("webkitendfullscreen", onWebkitEnd);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      video?.removeEventListener("webkitbeginfullscreen", onWebkitBegin);
      video?.removeEventListener("webkitendfullscreen", onWebkitEnd);
    };
  }, []);

  const showControls = (autoHide = true) => {
    if (!contentReady) return;
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (!autoHide) return;
    hideTimerRef.current = window.setTimeout(() => {
      if (!videoRef.current?.paused) {
        setControlsVisible(false);
      }
    }, isTouchRef.current ? 4500 : 3000);
  };

  useEffect(() => {
    if (!contentReady) return;
    const timer = window.setTimeout(() => {
      showControls();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [contentReady]);

  const togglePlay = async () => {
    if (!contentReady) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
    showControls();
  };

  useEffect(() => {
    if (!contentReady) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      event.preventDefault();
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        void video.play();
      } else {
        video.pause();
      }
      showControls();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [contentReady]);

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
    showControls();
  };

  const skip = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const max = duration || video.duration || 0;
    const next = Math.min(Math.max(0, video.currentTime + delta), max);
    video.currentTime = next;
    setCurrentTime(next);
    showControls();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current as WebkitVideoElement | null;
    if (!container || !video) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        showControls();
        return;
      }

      if (video.webkitDisplayingFullscreen && video.webkitExitFullscreen) {
        video.webkitExitFullscreen();
        showControls();
        return;
      }

      if (typeof video.webkitEnterFullscreen === "function") {
        video.webkitEnterFullscreen();
        showControls();
        return;
      }

      await container.requestFullscreen();
    } catch {
      // Fullscreen may be blocked by browser policy
    }
    showControls();
  };

  const changeRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    showControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    showControls();
  };

  const toggleIntroMute = () => {
    const video = introVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIntroMuted(video.muted);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-black overflow-hidden touch-manipulation"
      onMouseMove={() => showControls()}
      onMouseLeave={() => {
        if (contentReady && !isTouchRef.current) setControlsVisible(false);
      }}
      onTouchStart={() => showControls()}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain bg-black transition-opacity duration-500 ease-in-out"
        style={{ opacity: contentReady && contentVisible ? 1 : 0 }}
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      <AnimatePresence
        onExitComplete={() => {
          setPhase((current) => (current === "fading" ? "content" : current));
        }}
      >
        {phase === "intro" && (
          <motion.div
            key="watch-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black"
          >
            <video
              ref={introVideoRef}
              src="/intro.mp4"
              autoPlay
              playsInline
              muted={introMuted}
              className="h-full w-full object-contain bg-black"
              onEnded={finishIntro}
              onError={finishIntro}
            />

            <div className="absolute top-0 right-0 flex items-center gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <button
                type="button"
                onClick={toggleIntroMute}
                className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label={introMuted ? "Unmute intro" : "Mute intro"}
              >
                {introMuted ? "Unmute" : "Mute"}
              </button>
              <button
                type="button"
                onClick={finishIntro}
                className="rounded-full border border-white/20 bg-black/50 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {contentReady && (
        <>
          <PlayerOverlay
            movie={movie}
            backHref={backHref}
            isVisible={controlsVisible}
            isLoading={isLoading}
            error={error}
            isGuest={isGuest}
            isPlaying={isPlaying}
          />

          <VideoControls
            isVisible={controlsVisible}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            isFullscreen={isFullscreen}
            playbackRate={playbackRate}
            muted={muted}
            onTogglePlay={togglePlay}
            onSeek={handleSeek}
            onSkip={skip}
            onToggleFullscreen={toggleFullscreen}
            onChangeRate={changeRate}
            onToggleMute={toggleMute}
          />
        </>
      )}
    </motion.div>
  );
}
