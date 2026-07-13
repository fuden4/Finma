"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { getMe, getWatchProgress, saveWatchProgress, getEpisodeWatchProgress, saveEpisodeWatchProgress } from "@/lib/api-client";

interface UseWatchProgressArgs {
  movieId?: string;
  episodeId?: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  autoPlay?: boolean;
  enabled?: boolean;
}

function tryAutoPlay(video: HTMLVideoElement) {
  const play = () => {
    void video.play().catch(() => {
      // Autoplay may be blocked; user can click or press space.
    });
  };

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    play();
  } else {
    video.addEventListener("canplay", play, { once: true });
  }
}

export function useWatchProgress({
  movieId,
  episodeId,
  videoRef,
  autoPlay = false,
  enabled = true,
}: UseWatchProgressArgs) {
  const authenticatedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const lastSavedRef = useRef<number>(0);
  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;

  const progressId = episodeId ?? movieId;

  const flushProgress = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !authenticatedRef.current || !progressId) return;

    const seconds = Math.floor(video.currentTime);
    if (seconds <= 0 || seconds === lastSavedRef.current) return;

    try {
      if (episodeId) {
        await saveEpisodeWatchProgress(episodeId, seconds);
      } else if (movieId) {
        await saveWatchProgress(movieId, seconds);
      }
      lastSavedRef.current = seconds;
    } catch {
      // Ignore save failures to keep playback smooth.
    }
  }, [movieId, episodeId, progressId, videoRef]);

  useEffect(() => {
    if (!enabled) return;

    const video = videoRef.current;
    if (!video) return;
    let mounted = true;

    const setup = async () => {
      const me = await getMe();
      if (!mounted) return;

      let autoPlayHandled = false;
      const finish = () => {
        if (!autoPlayRef.current || autoPlayHandled) return;
        autoPlayHandled = true;
        tryAutoPlay(video);
      };

      if (me?.user) {
        authenticatedRef.current = true;
        try {
          const result = episodeId
            ? await getEpisodeWatchProgress(episodeId)
            : movieId
              ? await getWatchProgress(movieId)
              : { progress: null };
          if (result.progress && result.progress.progress_seconds > 0) {
            const resumeAt = result.progress.progress_seconds;
            const seekOnce = () => {
              video.currentTime = resumeAt;
              video.removeEventListener("loadedmetadata", seekOnce);
              finish();
            };

            if (video.readyState >= 1) {
              video.currentTime = resumeAt;
              finish();
            } else {
              video.addEventListener("loadedmetadata", seekOnce);
            }
            return;
          }
        } catch {
          // If resume fails, keep playback at start.
        }
      }

      finish();
    };

    setup();

    return () => {
      mounted = false;
    };
  }, [movieId, episodeId, videoRef, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const video = videoRef.current;
    if (!video) return;

    const queueSave = () => {
      if (!authenticatedRef.current) return;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        void flushProgress();
      }, 7000);
    };

    const saveNow = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      void flushProgress();
    };

    video.addEventListener("timeupdate", queueSave);
    video.addEventListener("pause", saveNow);
    window.addEventListener("beforeunload", saveNow);

    return () => {
      video.removeEventListener("timeupdate", queueSave);
      video.removeEventListener("pause", saveNow);
      window.removeEventListener("beforeunload", saveNow);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      void flushProgress();
    };
  }, [flushProgress, videoRef, enabled]);
}
