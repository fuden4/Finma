"use client";

import { useEffect, useState, type RefObject } from "react";
import Hls from "hls.js";

interface UseHlsPlayerArgs {
  videoRef: RefObject<HTMLVideoElement | null>;
  hlsUrl: string;
  enabled?: boolean;
}

export function useHlsPlayer({
  videoRef,
  hlsUrl,
  enabled = true,
}: UseHlsPlayerArgs) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !hlsUrl) {
      setIsLoading(false);
      setError(null);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setIsLoading(true);
    setError(null);

    const handleLoaded = () => setIsLoading(false);
    const handleError = () => {
      setError("Video unavailable");
      setIsLoading(false);
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("canplay", handleLoaded);
    video.addEventListener("error", handleError);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Video unavailable");
          setIsLoading(false);
        }
      });
    } else {
      window.setTimeout(() => {
        setError("HLS is not supported in this browser");
        setIsLoading(false);
      }, 0);
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("canplay", handleLoaded);
      video.removeEventListener("error", handleError);
      if (hls) hls.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [hlsUrl, videoRef, enabled]);

  return { isLoading, error };
}
