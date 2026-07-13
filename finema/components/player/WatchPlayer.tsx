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
  const inIntro = phase === "intro";
  const showChrome = phase === "intro" || phase === "content";
  const hlsEnabled = phase === "fading" || phase === "content";

  const getActiveVideo = useCallback((): HTMLVideoElement | null => {
    if (phase === "intro" || phase === "fading") {
      return introVideoRef.current;
    }
    return videoRef.current;
  }, [phase]);

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
      const intro = introVideoRef.current;
      if (intro) {
        intro.pause();
      }
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
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

  // Intro: play unmuted in the same player chrome
  useEffect(() => {
    if (phase !== "intro") return;
    const video = introVideoRef.current;
    if (!video) return;

    video.muted = false;
    setMuted(false);

    const playUnmuted = async () => {
      try {
        await video.play();
        setMuted(false);
        setIsPlaying(true);
      } catch {
        // Browser may block unmuted autoplay; keep attempting unmuted after user gesture via controls
        setIsPlaying(false);
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

  // Bind play/time/mute state to whichever video is active
  useEffect(() => {
    if (phase === "fading") return;

    const video =
      phase === "intro" ? introVideoRef.current : videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      stopMusic();
    };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoaded = () => setDuration(video.duration || 0);
    const onVolumeChange = () => setMuted(video.muted);

    if (video.readyState >= 1) {
      setDuration(video.duration || 0);
      setCurrentTime(video.currentTime);
      setMuted(video.muted);
      setIsPlaying(!video.paused);
    }

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
  }, [phase, stopMusic]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const contentVideo = videoRef.current as WebkitVideoElement | null;
    const introVideo = introVideoRef.current as WebkitVideoElement | null;
    const onWebkitBegin = () => setIsFullscreen(true);
    const onWebkitEnd = () => setIsFullscreen(false);
    contentVideo?.addEventListener("webkitbeginfullscreen", onWebkitBegin);
    contentVideo?.addEventListener("webkitendfullscreen", onWebkitEnd);
    introVideo?.addEventListener("webkitbeginfullscreen", onWebkitBegin);
    introVideo?.addEventListener("webkitendfullscreen", onWebkitEnd);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      contentVideo?.removeEventListener("webkitbeginfullscreen", onWebkitBegin);
      contentVideo?.removeEventListener("webkitendfullscreen", onWebkitEnd);
      introVideo?.removeEventListener("webkitbeginfullscreen", onWebkitBegin);
      introVideo?.removeEventListener("webkitendfullscreen", onWebkitEnd);
    };
  }, []);

  const showControls = (autoHide = true) => {
    if (!showChrome) return;
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (!autoHide) return;
    hideTimerRef.current = window.setTimeout(() => {
      const video = getActiveVideo();
      if (video && !video.paused) {
        setControlsVisible(false);
      }
    }, isTouchRef.current ? 4500 : 3000);
  };

  useEffect(() => {
    if (!showChrome) return;
    const timer = window.setTimeout(() => {
      showControls();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showControls reads phase via showChrome
  }, [showChrome]);

  const togglePlay = async () => {
    if (!showChrome) return;
    const video = getActiveVideo();
    if (!video) return;
    if (video.paused) {
      video.muted = false;
      setMuted(false);
      await video.play().catch(() => {});
    } else {
      video.pause();
    }
    showControls();
  };

  useEffect(() => {
    if (!showChrome) return;

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
      void togglePlay();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChrome, phase]);

  const handleSeek = (value: number) => {
    if (inIntro) {
      const video = introVideoRef.current;
      if (!video) return;
      const max = video.duration || duration || 0;
      if (max > 0 && value >= max - 0.25) {
        finishIntro();
        return;
      }
      video.currentTime = value;
      setCurrentTime(value);
      showControls();
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
    showControls();
  };

  const skip = (delta: number) => {
    if (inIntro) {
      const video = introVideoRef.current;
      if (!video) return;
      const max = duration || video.duration || 0;
      const next = Math.min(Math.max(0, video.currentTime + delta), max);
      if (max > 0 && next >= max - 0.25) {
        finishIntro();
        return;
      }
      video.currentTime = next;
      setCurrentTime(next);
      showControls();
      return;
    }

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
    const video = getActiveVideo() as WebkitVideoElement | null;
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
    const video = getActiveVideo();
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    showControls();
  };

  const toggleMute = () => {
    const video = getActiveVideo();
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    showControls();
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
        if (showChrome && !isTouchRef.current) setControlsVisible(false);
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
            className="absolute inset-0 z-[5] flex items-center justify-center bg-black"
          >
            <video
              ref={introVideoRef}
              src="/intro.mp4"
              autoPlay
              playsInline
              muted={muted}
              className="h-full w-full object-contain bg-black"
              onClick={togglePlay}
              onEnded={finishIntro}
              onError={finishIntro}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showChrome && (
        <>
          <PlayerOverlay
            movie={movie}
            backHref={backHref}
            isVisible={controlsVisible}
            isLoading={contentReady ? isLoading : false}
            error={contentReady ? error : null}
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
