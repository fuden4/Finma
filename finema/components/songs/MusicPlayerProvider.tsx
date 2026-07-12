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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndedRef = useRef<(() => void) | null>(null);
  const autoplayOnLoadRef = useRef(false);
  const isDraggingRef = useRef(false);
  const loadedTrackIdRef = useRef<string | null>(null);
  const durationRef = useRef(0);
  const trackRef = useRef<MusicTrack | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const repeatRef = useRef(false);

  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [view, setView] = useState<PlayerView>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [audioNode, setAudioNode] = useState<HTMLAudioElement | null>(null);

  trackRef.current = track;
  durationRef.current = duration;
  repeatRef.current = repeat;

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const getEffectiveDuration = useCallback(() => {
    const audio = audioRef.current;
    const stateDuration = durationRef.current;
    if (stateDuration > 0) return stateDuration;
    if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
      return audio.duration;
    }
    const trackDuration = trackRef.current?.duration_seconds ?? 0;
    return trackDuration > 0 ? trackDuration : 0;
  }, []);

  const applyPendingSeek = useCallback(
    (audio: HTMLAudioElement) => {
      if (pendingSeekRef.current === null) return;
      const max = getEffectiveDuration();
      if (max <= 0) return;
      const clamped = Math.min(max, Math.max(0, pendingSeekRef.current));
      pendingSeekRef.current = null;
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [getEffectiveDuration]
  );

  const syncAudioSource = useCallback((forceReload = false) => {
    const audio = audioRef.current;
    const currentTrack = trackRef.current;
    if (!audio || !currentTrack) return false;

    const needsLoad =
      forceReload ||
      loadedTrackIdRef.current !== currentTrack.id ||
      !audio.currentSrc;

    if (!needsLoad) return true;

    const resumeAt = forceReload
      ? (pendingSeekRef.current ?? audio.currentTime)
      : null;

    loadedTrackIdRef.current = currentTrack.id;
    if (!forceReload) {
      pendingSeekRef.current = null;
      setCurrentTime(0);
    }
    audio.src = currentTrack.audio_url;
    audio.load();

    if (forceReload && resumeAt != null && resumeAt > 0) {
      pendingSeekRef.current = resumeAt;
    }

    return true;
  }, []);

  const setAudioRef = useCallback((node: HTMLAudioElement | null) => {
    audioRef.current = node;
    setAudioNode(node);
  }, []);

  useEffect(() => {
    if (!audioNode) return;

    const onTimeUpdate = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(audioNode.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (Number.isFinite(audioNode.duration) && audioNode.duration > 0) {
        setDuration(audioNode.duration);
      } else if (trackRef.current?.duration_seconds) {
        setDuration(trackRef.current.duration_seconds);
      }
      applyPendingSeek(audioNode);
    };
    const onDurationChange = () => {
      if (Number.isFinite(audioNode.duration) && audioNode.duration > 0) {
        setDuration(audioNode.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (repeatRef.current) {
        audioNode.currentTime = 0;
        void audioNode.play().catch(() => undefined);
        return;
      }
      onEndedRef.current?.();
    };

    audioNode.addEventListener("timeupdate", onTimeUpdate);
    audioNode.addEventListener("loadedmetadata", onLoadedMetadata);
    audioNode.addEventListener("durationchange", onDurationChange);
    audioNode.addEventListener("play", onPlay);
    audioNode.addEventListener("pause", onPause);
    audioNode.addEventListener("ended", onEnded);

    return () => {
      audioNode.removeEventListener("timeupdate", onTimeUpdate);
      audioNode.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioNode.removeEventListener("durationchange", onDurationChange);
      audioNode.removeEventListener("play", onPlay);
      audioNode.removeEventListener("pause", onPause);
      audioNode.removeEventListener("ended", onEnded);
    };
  }, [audioNode, applyPendingSeek]);

  useEffect(() => {
    if (!audioNode || !track) return;

    syncAudioSource();

    if (autoplayOnLoadRef.current) {
      autoplayOnLoadRef.current = false;
      void audioNode.play().catch(() => undefined);
    }
  }, [audioNode, track, syncAudioSource]);

  useEffect(() => {
    if (audioNode) audioNode.loop = repeat;
  }, [audioNode, repeat]);

  useEffect(() => {
    if (audioNode) audioNode.volume = volume;
  }, [audioNode, volume]);

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
    if (!audio || !trackRef.current) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    if (!syncAudioSource()) return;

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      applyPendingSeek(audio);
    }

    void audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        syncAudioSource(true);
        void audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      });
  }, [applyPendingSeek, syncAudioSource]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const max = getEffectiveDuration();
      if (max <= 0) return;
      const clamped = Math.min(max, Math.max(0, time));
      if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
        pendingSeekRef.current = clamped;
        setCurrentTime(clamped);
        return;
      }
      pendingSeekRef.current = null;
      try {
        audio.currentTime = clamped;
        setCurrentTime(audio.currentTime);
      } catch {
        pendingSeekRef.current = clamped;
        setCurrentTime(clamped);
      }
    },
    [getEffectiveDuration]
  );

  const seekByClientX = useCallback(
    (clientX: number, barWidth: number, barLeft: number) => {
      if (barWidth <= 0) return;
      const effectiveDuration = getEffectiveDuration();
      if (effectiveDuration <= 0) return;
      const ratio = Math.min(1, Math.max(0, (clientX - barLeft) / barWidth));
      seek(ratio * effectiveDuration);
    },
    [getEffectiveDuration, seek]
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
    pendingSeekRef.current = null;
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
      <audio
        ref={setAudioRef}
        preload="auto"
        playsInline
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px opacity-0"
      />
    </MusicPlayerContext.Provider>
  );
}
