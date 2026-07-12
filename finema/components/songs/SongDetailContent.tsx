"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Playlist, PublicUser, SongWithStats } from "@/db/types";
import {
  addSongToPlaylist,
  getMe,
  getPlaylists,
  getSong,
  likeSong,
  unlikeSong,
} from "@/lib/api-client";
import { songPath } from "@/lib/content-paths";
import { Navbar } from "@/components/layout/Navbar";
import { SongCard } from "./SongCard";
import { SongPlayer } from "./SongPlayer";
import { SongVolumeControl } from "./SongVolumeControl";
import {
  type MusicTrack,
  useMusicPlayer,
} from "./MusicPlayerProvider";

interface SongDetailContentProps {
  songId: string;
  relatedSongs: SongWithStats[];
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SongDetailContent({
  songId,
  relatedSongs,
}: SongDetailContentProps) {
  const router = useRouter();
  const {
    track,
    loadTrack,
    expand,
    minimize,
    isPlaying,
    requestAutoplayOnNextLoad,
  } = useMusicPlayer();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [song, setSong] = useState<SongWithStats | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState("");
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const queue = useMemo(
    () => [song, ...relatedSongs.filter((r) => r.id !== songId)].filter(Boolean) as SongWithStats[],
    [relatedSongs, song, songId]
  );

  const queueIndex = queue.findIndex((item) => item.id === songId);
  const hasPrevious = queueIndex > 0;
  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1;

  useEffect(() => {
    async function load() {
      try {
        const [me, songRes] = await Promise.all([getMe(), getSong(songId)]);
        setUser(me?.user ?? null);
        setSong(songRes.song);
        if (me?.user) {
          const pl = await getPlaylists().catch(() => ({ playlists: [] }));
          setPlaylists(pl.playlists);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load song");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [songId]);

  useEffect(() => {
    if (!song) return;
    const musicTrack: MusicTrack = {
      id: song.id,
      slug: song.slug,
      title: song.title,
      artist: song.artist,
      cover_url: song.cover_url,
      audio_url: song.audio_url,
      duration_seconds: song.duration_seconds,
      volume_adjustment_db: song.volume_adjustment_db,
    };
    if (track?.id === song.id) {
      expand();
    } else {
      loadTrack(musicTrack, { view: "expanded" });
    }
  }, [song, track?.id, loadTrack, expand]);

  function handleMinimize() {
    minimize();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/songs");
    }
  }

  function goToTrack(offset: number) {
    const next = queue[queueIndex + offset];
    if (!next) return;
    if (isPlaying) {
      requestAutoplayOnNextLoad();
    }
    router.push(songPath(next));
  }

  async function handleLikeToggle() {
    if (!song || !user || liking) return;
    setLiking(true);
    const wasLiked = song.liked_by_me;
    setSong({
      ...song,
      liked_by_me: !wasLiked,
      like_count: wasLiked
        ? Math.max(0, song.like_count - 1)
        : song.like_count + 1,
    });
    try {
      const result = wasLiked
        ? await unlikeSong(song.id)
        : await likeSong(song.id);
      setSong((prev) =>
        prev
          ? { ...prev, like_count: result.like_count, liked_by_me: result.liked_by_me }
          : prev
      );
    } catch {
      setSong((prev) =>
        prev
          ? {
              ...prev,
              liked_by_me: wasLiked,
              like_count: song.like_count,
            }
          : prev
      );
    } finally {
      setLiking(false);
    }
  }

  async function handleAddToPlaylist(playlistId: string) {
    if (!song) return;
    try {
      await addSongToPlaylist(playlistId, song.id);
      setPlaylistOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-[#1ed760] border-t-transparent"
        />
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-finema-bg">
        <Navbar user={user} />
        <div className="pt-24 px-4 text-red-300">{error || "Song not found"}</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f0a] text-white">
      <div className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={song.cover_url}
          alt=""
          aria-hidden
          className="h-full w-full scale-110 object-cover opacity-40 blur-3xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0a]/30 via-[#0a0f0a]/80 to-[#0a0f0a]" />
      </div>

      <div className="relative z-10">
        <Navbar user={user} />

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col px-4 pb-10 pt-20 sm:pt-24"
        >
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleMinimize}
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Minimize player"
            >
              <ChevronDownIcon className="h-6 w-6" />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                {song.category_name ? `Playing from ${song.category_name}` : "Now playing"}
              </p>
            </div>
            <div className="w-10" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mb-8 aspect-square w-full max-w-[min(100%,22rem)] overflow-hidden rounded-xl shadow-2xl shadow-black/60"
          >
            <motion.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={song.cover_url}
                alt={song.title}
                className="h-full w-full object-cover"
              />
            </motion.div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </motion.div>

          <div className="mb-4 flex justify-center">
            <SongVolumeControl />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="mb-6 flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold leading-tight sm:text-3xl">
                {song.title}
              </h1>
              {song.artist && (
                <p className="mt-1 truncate text-base text-white/60">{song.artist}</p>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {user && playlists.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPlaylistOpen((open) => !open)}
                    className="rounded-full border border-white/20 p-2 text-white/80 transition-colors hover:border-white hover:text-white"
                    aria-label="Add to playlist"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                  <AnimatePresence>
                    {playlistOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#282828] shadow-xl"
                      >
                        {playlists.map((pl) => (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => void handleAddToPlaylist(pl.id)}
                            className="block w-full px-4 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
                          >
                            {pl.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}

              {user ? (
                <motion.button
                  type="button"
                  onClick={() => void handleLikeToggle()}
                  disabled={liking}
                  whileTap={{ scale: 0.94 }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm ${
                    song.liked_by_me
                      ? "bg-[#1ed760]/20 text-[#1ed760]"
                      : "border border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                  }`}
                >
                  <motion.span
                    key={song.liked_by_me ? "liked" : "unliked"}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    {song.liked_by_me ? "♥" : "♡"}
                  </motion.span>
                  {song.like_count} {song.like_count === 1 ? "like" : "likes"}
                </motion.button>
              ) : (
                <Link
                  href={`/login?redirect=${encodeURIComponent(songPath(song))}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70 transition-colors hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                >
                  ♡ {song.like_count} · Sign in to like
                </Link>
              )}

              <a
                href={`/api/songs/${song.id}/download`}
                className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition-transform hover:scale-[1.02] sm:px-4 sm:py-2 sm:text-sm"
              >
                Download
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
          >
            <SongPlayer
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPrevious={() => goToTrack(-1)}
              onNext={() => goToTrack(1)}
            />
          </motion.div>

          {song.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-8 text-center text-sm leading-relaxed text-white/60"
            >
              {song.description}
            </motion.p>
          )}
        </motion.main>

        {relatedSongs.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="relative z-10 border-t border-white/10 bg-black/40 px-4 py-12 backdrop-blur-md md:px-8"
          >
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-4 text-xl font-semibold text-white">
                More in {song.category_name}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {relatedSongs.map((related, index) => (
                  <motion.div
                    key={related.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SongCard song={related} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
