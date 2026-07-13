"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MovieDetail } from "@/db/types";
import {
  getMe,
  getWatchProgress,
  getEpisodeWatchProgress,
} from "@/lib/api-client";
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
  const introDurationRef = useRef(0);
  const contentDurationRef = useRef(0);
  const pendingContentSeekRef = useRef(0);
  const hideTimerRef = useRef<number | null>(null);
  const isTouchRef = useRef(false);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [phase, setPhase] = useState<WatchPhase>("intro");
  const [contentVisible, setContentVisible] = useState(false);
  const [applyResume, setApplyResume] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [introDuration, setIntroDuration] = useState(0);
  const [contentDuration, setContentDuration] = useState(0);
  const [timelineTime, setTimelineTime] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const { stop: stopMusic } = useMusicPlayer();

  const contentReady = phase === "content";
  const inIntro = phase === "intro";
  const showChrome = phase === "intro" || phase === "content";
  const timelineDuration = introDuration + contentDuration;

  const getActiveVideo = useCallback((): HTMLVideoElement | null => {
    if (phase === "intro" || phase === "fading") {
      return introVideoRef.current;
    }
    return videoRef.current;
  }, [phase]);

  // Load HLS early so content duration fills the combined timeline during the intro.
  const { isLoading, error } = useHlsPlayer({
    videoRef,
    hlsUrl: movie.hls_playlist_url ?? "",
    enabled: bootstrapped,
  });

  useWatchProgress({
    movieId: episodeId ? undefined : movie.id,
    episodeId,
    videoRef,
    autoPlay: true,
    enabled: contentReady,
    applyResume,
  });

  const syncTimelineFromVideos = useCallback(() => {
    const intro = introVideoRef.current;
    const content = videoRef.current;
    if (phase === "intro" || phase === "fading") {
      setTimelineTime(intro?.currentTime ?? 0);
      return;
    }
    setTimelineTime(
      introDurationRef.current + (content?.currentTime ?? 0)
    );
  }, [phase]);

  const beginContentAt = useCallback((contentSeekSeconds: number) => {
    pendingContentSeekRef.current = Math.max(0, contentSeekSeconds);
    setPhase((current) => {
      if (current === "fading" || current === "content") return current;
      introVideoRef.current?.pause();
      setApplyResume(false);
      setIsPlaying(false);
      return "fading";
    });
  }, []);

  const enterIntroAt = useCallback((introSeekSeconds: number) => {
    const content = videoRef.current;
    content?.pause();
    setContentVisible(false);
    setPhase("intro");
    setApplyResume(false);

    window.setTimeout(() => {
      const intro = introVideoRef.current;
      if (!intro) return;
      const max = introDurationRef.current || intro.duration || 0;
      intro.currentTime = Math.min(Math.max(0, introSeekSeconds), Math.max(0, max - 0.05));
      setTimelineTime(intro.currentTime);
      intro.muted = muted;
      void intro.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }, 0);
  }, [muted]);

  // Bootstrap: resume mid-movie skips intro; fresh starts begin on intro.
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const me = await getMe();
      if (!mounted) return;
      setIsGuest(!me?.user);

      let resumeAt = 0;
      if (me?.user) {
        try {
          const result = episodeId
            ? await getEpisodeWatchProgress(episodeId)
            : await getWatchProgress(movie.id);
          resumeAt = result.progress?.progress_seconds ?? 0;
        } catch {
          resumeAt = 0;
        }
      }

      if (!mounted) return;

      if (resumeAt > 0) {
        pendingContentSeekRef.current = resumeAt;
        setApplyResume(false);
        setPhase("content");
        setContentVisible(true);
        setTimelineTime(introDurationRef.current + resumeAt);
      } else {
        setApplyResume(false);
        setPhase("intro");
      }
      setBootstrapped(true);
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [movie.id, episodeId]);

  // Always know intro length so the scrubber can show intro + movie even on resume.
  useEffect(() => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = "/intro.mp4";
    const onMeta = () => {
      const d = probe.duration || 0;
      if (d > 0 && Number.isFinite(d)) {
        introDurationRef.current = d;
        setIntroDuration(d);
      }
    };
    probe.addEventListener("loadedmetadata", onMeta);
    return () => {
      probe.removeEventListener("loadedmetadata", onMeta);
      probe.removeAttribute("src");
      probe.load();
    };
  }, []);

  useEffect(() => {
    if (phase !== "content") return;
    const content = videoRef.current;
    if (!content) return;
    setTimelineTime(introDuration + (content.currentTime || 0));
  }, [introDuration, phase]);

  useEffect(() => {
    isTouchRef.current = isCoarsePointerDevice();
  }, []);

  useEffect(() => {
    stopMusic();
  }, [stopMusic]);

  // Intro playback (unmuted)
  useEffect(() => {
    if (!bootstrapped || phase !== "intro") return;
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
        setIsPlaying(false);
      }
    };

    void playUnmuted();
  }, [bootstrapped, phase]);

  // After fade: land on content segment of the unified timeline
  useEffect(() => {
    if (phase !== "content") return;
    const video = videoRef.current;
    if (!video) return;

    const seekTo = pendingContentSeekRef.current;
    pendingContentSeekRef.current = 0;

    const prepareAndReveal = () => {
      if (Number.isFinite(seekTo)) {
        try {
          video.currentTime = seekTo;
        } catch {
          // Ignore seek races before media is ready.
        }
      }
      setTimelineTime(introDurationRef.current + (video.currentTime || seekTo));
      setContentVisible(true);
    };

    if (video.readyState >= 1) {
      prepareAndReveal();
    } else {
      video.addEventListener("loadedmetadata", prepareAndReveal, { once: true });
      return () => video.removeEventListener("loadedmetadata", prepareAndReveal);
    }
  }, [phase]);

  // Track durations for both segments so the scrubber spans intro + movie
  useEffect(() => {
    if (!bootstrapped) return;

    const intro = introVideoRef.current;
    const content = videoRef.current;

    const onIntroMeta = () => {
      const d = intro?.duration || 0;
      if (d > 0 && Number.isFinite(d)) {
        introDurationRef.current = d;
        setIntroDuration(d);
      }
    };
    const onContentMeta = () => {
      const d = content?.duration || 0;
      if (d > 0 && Number.isFinite(d)) {
        contentDurationRef.current = d;
        setContentDuration(d);
      }
    };

    intro?.addEventListener("loadedmetadata", onIntroMeta);
    content?.addEventListener("loadedmetadata", onContentMeta);
    if (intro && intro.readyState >= 1) onIntroMeta();
    if (content && content.readyState >= 1) onContentMeta();

    return () => {
      intro?.removeEventListener("loadedmetadata", onIntroMeta);
      content?.removeEventListener("loadedmetadata", onContentMeta);
    };
  }, [bootstrapped, phase]);

  // Active-video events → unified timeline clock
  useEffect(() => {
    if (!bootstrapped || phase === "fading") return;

    const video =
      phase === "intro" ? introVideoRef.current : videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      stopMusic();
    };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => syncTimelineFromVideos();
    const onVolumeChange = () => setMuted(video.muted);

    setMuted(video.muted);
    setIsPlaying(!video.paused);
    syncTimelineFromVideos();

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("volumechange", onVolumeChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, [bootstrapped, phase, stopMusic, syncTimelineFromVideos]);

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
  }, [bootstrapped]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const seekTimeline = (value: number) => {
    const introDur = introDurationRef.current;
    const contentDur = contentDurationRef.current;
    const total = introDur + contentDur;
    const clamped = Math.min(Math.max(0, value), Math.max(total, 0));

    if (introDur <= 0) {
      // Intro metadata not ready yet — treat as content-only.
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = clamped;
      setTimelineTime(clamped);
      showControls();
      return;
    }

    if (clamped < introDur - 0.05) {
      if (phase === "content" || phase === "fading") {
        enterIntroAt(clamped);
      } else {
        const intro = introVideoRef.current;
        if (intro) {
          intro.currentTime = clamped;
          setTimelineTime(clamped);
        }
      }
      showControls();
      return;
    }

    const contentSeek = Math.min(
      Math.max(0, clamped - introDur),
      Math.max(0, contentDur)
    );

    if (phase === "intro") {
      beginContentAt(contentSeek);
    } else if (phase === "content") {
      const video = videoRef.current;
      if (video) {
        video.currentTime = contentSeek;
        setTimelineTime(introDur + contentSeek);
      }
    }
    showControls();
  };

  const handleSeek = (value: number) => {
    seekTimeline(value);
  };

  const skip = (delta: number) => {
    seekTimeline(timelineTime + delta);
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

  if (!bootstrapped) {
    return (
      <div className="relative w-full h-[100dvh] min-h-[100dvh] bg-black" />
    );
  }

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
        preload="auto"
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
              onEnded={() => beginContentAt(0)}
              onError={() => beginContentAt(0)}
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
            currentTime={timelineTime}
            duration={timelineDuration}
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
