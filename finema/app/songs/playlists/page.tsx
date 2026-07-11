"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Playlist, PublicUser } from "@/db/types";
import { createPlaylist, getMe, getPlaylists } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";

export default function PlaylistsPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    getPlaylists()
      .then(({ playlists: list }) => setPlaylists(list))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getMe().then((me) => {
      if (!me?.user) {
        window.location.href = "/login?redirect=/songs/playlists";
        return;
      }
      setUser(me.user);
      load();
    });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createPlaylist({ name: name.trim() });
    setName("");
    load();
  }

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-24 px-4 md:px-8 pb-16 max-w-3xl mx-auto"
      >
        <Link href="/songs" className="text-sm text-finema-muted hover:text-finema-text">
          ← Back to Songs
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-finema-text">My Playlists</h1>
        <form onSubmit={handleCreate} className="mt-6 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New playlist name"
            className="flex-1 rounded-lg border border-white/10 bg-finema-surface px-4 py-2.5"
          />
          <button
            type="submit"
            className="rounded-lg bg-finema-accent px-4 py-2.5 text-sm text-white hover:bg-red-600"
          >
            Create
          </button>
        </form>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : (
          <ul className="mt-8 space-y-2">
            {playlists.map((pl) => (
              <li key={pl.id}>
                <Link
                  href={`/songs/playlists/${pl.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-4 hover:border-white/25 transition-colors"
                >
                  <span className="font-medium text-finema-text">{pl.name}</span>
                  <span className="text-sm text-finema-muted">
                    {pl.song_count ?? 0} songs
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </motion.main>
    </div>
  );
}
