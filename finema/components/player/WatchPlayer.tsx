"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { MovieDetail } from "@/db/types";
import { getMe } from "@/lib/api-client";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { PlayerOverlay } from "./PlayerOverlay";
import { VideoControls } from "./VideoControls";

interface WatchPlayerProps {
  movie: MovieDetail;
}

export function WatchPlayer({ movie }: WatchPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  const { isLoading, error } = useHlsPlayer({
    videoRef,
    hlsUrl: movie.hls_playlist_url ?? "",
  });

  useWatchProgress({ movieId: movie.id, videoRef, autoPlay: true });

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
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
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
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const showControls = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      showControls();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const togglePlay = async () => {
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
  }, []);

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
    if (!container) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
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

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={showControls}
      onMouseLeave={() => setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        playsInline
        onClick={togglePlay}
      />

      <PlayerOverlay
        movie={movie}
        isVisible={controlsVisible}
        isLoading={isLoading}
        error={error}
        isGuest={isGuest}
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
    </motion.div>
  );
}
