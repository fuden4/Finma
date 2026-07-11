"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import type { SongBlockWithSongs, PublicUser } from "@/db/types";
import {
  getMe,
  getSongBlock,
  likeSongBlock,
  unlikeSongBlock,
} from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { SongBlockCard } from "@/components/songs/SongBlockCard";
import { SongCard } from "@/components/songs/SongCard";

export default function SongBlockPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [block, setBlock] = useState<SongBlockWithSongs | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    Promise.all([getMe(), getSongBlock(params.id)])
      .then(([me, res]) => {
        setUser(me?.user ?? null);
        setBlock(res.block);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load block")
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleLikeToggle() {
    if (!block || !user || liking) return;
    setLiking(true);
    const wasLiked = block.liked_by_me;
    setBlock({
      ...block,
      liked_by_me: !wasLiked,
      like_count: wasLiked
        ? Math.max(0, block.like_count - 1)
        : block.like_count + 1,
    });
    try {
      const result = wasLiked
        ? await unlikeSongBlock(block.id)
        : await likeSongBlock(block.id);
      setBlock((prev) =>
        prev
          ? { ...prev, like_count: result.like_count, liked_by_me: result.liked_by_me }
          : prev
      );
    } catch {
      setBlock((prev) =>
        prev
          ? { ...prev, liked_by_me: wasLiked, like_count: block.like_count }
          : prev
      );
    } finally {
      setLiking(false);
    }
  }

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
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : error || !block ? (
          <p className="mt-6 text-red-300">{error || "Block not found"}</p>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
              <div className="w-full max-w-[200px] shrink-0">
                <SongBlockCard block={block} interactive={false} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-finema-text">{block.title}</h1>
                {block.description && (
                  <p className="mt-2 text-finema-muted max-w-2xl">{block.description}</p>
                )}
                <p className="mt-3 text-sm text-finema-muted">
                  {block.song_count ?? block.songs.length}{" "}
                  {(block.song_count ?? block.songs.length) === 1 ? "song" : "songs"}
                  {block.like_count > 0 ? ` · ${block.like_count} likes` : ""}
                </p>
                {user ? (
                  <button
                    type="button"
                    onClick={() => void handleLikeToggle()}
                    disabled={liking}
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      block.liked_by_me
                        ? "bg-finema-accent/20 text-finema-accent"
                        : "border border-white/20 text-finema-muted hover:text-finema-text"
                    }`}
                  >
                    {block.liked_by_me ? "♥" : "♡"} Collection
                  </button>
                ) : (
                  <Link
                    href={`/login?redirect=/songs/blocks/${block.id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm text-finema-muted hover:text-finema-text"
                  >
                    ♡ Sign in to like this collection
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {block.songs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </>
        )}
      </motion.main>
    </div>
  );
}
