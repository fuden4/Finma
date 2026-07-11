"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import type { PlaylistWithSongs, PublicUser } from "@/db/types";
import {
  getMe,
  getPlaylist,
  removeSongFromPlaylist,
} from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { SongCard } from "@/components/songs/SongCard";

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistWithSongs | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    if (!params.id) return;
    getPlaylist(params.id)
      .then(({ playlist: pl }) => setPlaylist(pl))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getMe().then((me) => {
      if (!me?.user) {
        window.location.href = `/login?redirect=/songs/playlists/${params.id}`;
        return;
      }
      setUser(me.user);
      load();
    });
  }, [params.id]);

  async function handleRemove(songId: string) {
    if (!playlist) return;
    await removeSongFromPlaylist(playlist.id, songId);
    load();
  }

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-24 px-4 md:px-8 pb-16 max-w-[1920px] mx-auto"
      >
        <Link
          href="/songs/playlists"
          className="text-sm text-finema-muted hover:text-finema-text"
        >
          ← Back to Playlists
        </Link>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : playlist ? (
          <>
            <h1 className="mt-4 text-3xl font-bold text-finema-text">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="mt-2 text-finema-muted">{playlist.description}</p>
            )}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {playlist.songs.map((song) => (
                <div key={song.id} className="relative group">
                  <SongCard song={{ ...song, like_count: 0, liked_by_me: false }} />
                  <button
                    type="button"
                    onClick={() => void handleRemove(song.id)}
                    className="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </motion.main>
    </div>
  );
}
