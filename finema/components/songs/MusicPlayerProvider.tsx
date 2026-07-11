"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { songPath } from "@/lib/content-paths";

export interface MusicTrack {
  id: string;
  slug?: string;
  title: string;
  artist: string | null;
  cover_url: string;
  audio_url: string;
  duration_seconds: number;
}

export type PlayerView = "expanded" | "minimized" | null;

interface MusicPlayerContextValue {
  track: MusicTrack | null;
  view: PlayerView;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  repeat: boolean;
  shuffle: boolean;
  volume: number;
  isDragging: boolean;
  setRepeat: (value: boolean) => void;
  setShuffle: (value: boolean) => void;
  setVolume: (value: number) => void;
  setIsDragging: (value: boolean) => void;
  loadTrack: (
    track: MusicTrack,
    options?: { autoplay?: boolean; view?: PlayerView }
  ) => void;
  requestAutoplayOnNextLoad: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekByClientX: (clientX: number, barWidth: number, barLeft: number) => void;
  skip: (seconds: number) => void;
  minimize: () => void;
  expand: () => void;
  maximize: () => void;
  stop: () => void;
  setOnEnded: (callback: (() => void) | null) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return ctx;
}

export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const onEndedRef = useRef<(() => void) | null>(null);
  const autoplayOnLoadRef = useRef(false);
  const isDraggingRef = useRef(false);
  const loadedTrackIdRef = useRef<string | null>(null);

  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [view, setView] = useState<PlayerView>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    if (loadedTrackIdRef.current !== track.id) {
      loadedTrackIdRef.current = track.id;
      audio.src = track.audio_url;
      audio.load();
      setCurrentTime(0);
    }

    if (autoplayOnLoadRef.current) {
      autoplayOnLoadRef.current = false;
      void audio.play().catch(() => undefined);
    }
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (track?.duration_seconds) {
        setDuration(track.duration_seconds);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (repeat) {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
        return;
      }
      onEndedRef.current?.();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [repeat, track?.duration_seconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.loop = repeat;
  }, [repeat]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const loadTrack = useCallback(
    (newTrack: MusicTrack, options?: { autoplay?: boolean; view?: PlayerView }) => {
      setTrack(newTrack);
      if (options?.view !== undefined) {
        setView(options.view);
      } else {
        setView("expanded");
      }
      if (options?.autoplay) {
        autoplayOnLoadRef.current = true;
      }
      if (newTrack.duration_seconds > 0) {
        setDuration(newTrack.duration_seconds);
      }
    },
    []
  );

  const requestAutoplayOnNextLoad = useCallback(() => {
    autoplayOnLoadRef.current = true;
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) {
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [track]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const max = duration > 0 ? duration : audio.duration;
      audio.currentTime = Math.min(max, Math.max(0, time));
      setCurrentTime(audio.currentTime);
    },
    [duration]
  );

  const seekByClientX = useCallback(
    (clientX: number, barWidth: number, barLeft: number) => {
      if (barWidth <= 0 || duration <= 0) return;
      const ratio = Math.min(1, Math.max(0, (clientX - barLeft) / barWidth));
      seek(ratio * duration);
    },
    [duration, seek]
  );

  const skip = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      seek(audio.currentTime + seconds);
    },
    [seek]
  );

  const minimize = useCallback(() => {
    if (track) setView("minimized");
  }, [track]);

  const expand = useCallback(() => {
    if (track) setView("expanded");
  }, [track]);

  const maximize = useCallback(() => {
    if (!track) return;
    setView("expanded");
    router.push(songPath(track));
  }, [router, track]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    loadedTrackIdRef.current = null;
    onEndedRef.current = null;
    autoplayOnLoadRef.current = false;
    setTrack(null);
    setView(null);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const setOnEnded = useCallback((callback: (() => void) | null) => {
    onEndedRef.current = callback;
  }, []);

  const value: MusicPlayerContextValue = {
    track,
    view,
    isPlaying,
    currentTime,
    duration,
    repeat,
    shuffle,
    volume,
    isDragging,
    setRepeat,
    setShuffle,
    setVolume,
    setIsDragging,
    loadTrack,
    requestAutoplayOnNextLoad,
    togglePlay,
    seek,
    seekByClientX,
    skip,
    minimize,
    expand,
    maximize,
    stop,
    setOnEnded,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </MusicPlayerContext.Provider>
  );
}
