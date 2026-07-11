"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PublicUser, SongBlockWithSongs, SongWithStats } from "@/db/types";
import {
  getLikedSongs,
  getMe,
  likeSongBlock,
  unlikeSongBlock,
} from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { SongBlockCard } from "@/components/songs/SongBlockCard";
import { SongCard } from "@/components/songs/SongCard";

export default function LikedSongsPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [blocks, setBlocks] = useState<SongBlockWithSongs[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingBlockId, setLikingBlockId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMe()
      .then(async (me) => {
        setUser(me?.user ?? null);
        if (!me?.user) {
          window.location.href = "/login?redirect=/songs/likes";
          return;
        }
        const res = await getLikedSongs();
        setSongs(res.songs);
        setBlocks(res.blocks);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load likes")
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleBlockUnlike(blockId: string) {
    if (likingBlockId) return;
    const block = blocks.find((item) => item.id === blockId);
    if (!block) return;

    setLikingBlockId(blockId);
    setBlocks((prev) => prev.filter((item) => item.id !== blockId));
    try {
      await unlikeSongBlock(blockId);
    } catch {
      if (block) setBlocks((prev) => [block, ...prev]);
    } finally {
      setLikingBlockId(null);
    }
  }

  async function handleBlockLike(blockId: string) {
    if (likingBlockId) return;
    setLikingBlockId(blockId);
    try {
      const result = await likeSongBlock(blockId);
      setBlocks((prev) =>
        prev.map((item) =>
          item.id === blockId
            ? { ...item, like_count: result.like_count, liked_by_me: result.liked_by_me }
            : item
        )
      );
    } finally {
      setLikingBlockId(null);
    }
  }

  const isEmpty = !loading && !error && songs.length === 0 && blocks.length === 0;

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-24 px-4 md:px-8 pb-16 max-w-[1920px] mx-auto"
      >
        <Link href="/songs" className="text-sm text-finema-muted hover:text-finema-text">
          ← Back to Songs
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-finema-text">Liked Songs</h1>
        <p className="mt-2 text-sm text-finema-muted">
          Songs and collections you&apos;ve liked.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <p className="mt-6 text-red-300">{error}</p>
        ) : isEmpty ? (
          <p className="mt-6 text-finema-muted">
            You haven&apos;t liked any songs or collections yet.
          </p>
        ) : (
          <>
            {blocks.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-finema-text mb-4">
                  Liked Collections
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {blocks.map((block, index) => (
                    <SongBlockCard
                      key={block.id}
                      block={block}
                      index={index}
                      showLike
                      liking={likingBlockId === block.id}
                      onLikeToggle={() =>
                        void (block.liked_by_me
                          ? handleBlockUnlike(block.id)
                          : handleBlockLike(block.id))
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {songs.length > 0 && (
              <section className={blocks.length > 0 ? "mt-12" : "mt-8"}>
                <h2 className="text-lg font-semibold text-finema-text mb-4">
                  Liked Songs
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {songs.map((song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </motion.main>
    </div>
  );
}
