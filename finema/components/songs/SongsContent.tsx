"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PublicUser, SongBlockWithSongs, SongCategory, SongWithStats } from "@/db/types";
import {
  getMe,
  getSongBlocks,
  getSongCategories,
  getSongs,
  likeSongBlock,
  unlikeSongBlock,
} from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { SongCard } from "./SongCard";
import { SongBlockCard } from "./SongBlockCard";

export function SongsContent() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [blocks, setBlocks] = useState<SongBlockWithSongs[]>([]);
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likingBlockId, setLikingBlockId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [me, cats, blocksRes, songsRes] = await Promise.all([
        getMe(),
        getSongCategories(),
        getSongBlocks(),
        getSongs({
          categoryId: activeCategory ?? undefined,
          q: search.trim() || undefined,
        }),
      ]);
      setUser(me?.user ?? null);
      setCategories(cats.categories);
      setBlocks(blocksRes.blocks);
      setSongs(songsRes.songs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load songs");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [loadData, search]);

  const showBlocks = !search.trim() && !activeCategory;

  async function handleBlockLikeToggle(blockId: string) {
    if (!user || likingBlockId) return;
    const block = blocks.find((item) => item.id === blockId);
    if (!block) return;

    setLikingBlockId(blockId);
    const wasLiked = block.liked_by_me;
    setBlocks((prev) =>
      prev.map((item) =>
        item.id === blockId
          ? {
              ...item,
              liked_by_me: !wasLiked,
              like_count: wasLiked
                ? Math.max(0, item.like_count - 1)
                : item.like_count + 1,
            }
          : item
      )
    );

    try {
      const result = wasLiked
        ? await unlikeSongBlock(blockId)
        : await likeSongBlock(blockId);
      setBlocks((prev) =>
        prev.map((item) =>
          item.id === blockId
            ? { ...item, like_count: result.like_count, liked_by_me: result.liked_by_me }
            : item
        )
      );
    } catch {
      setBlocks((prev) =>
        prev.map((item) =>
          item.id === blockId
            ? { ...item, liked_by_me: wasLiked, like_count: block.like_count }
            : item
        )
      );
    } finally {
      setLikingBlockId(null);
    }
  }

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-24 pb-16"
      >
        <div className="px-4 md:px-8 mb-8 max-w-[1920px] mx-auto">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-finema-text mb-2">Songs</h1>
              <p className="text-finema-muted">
                Browse music by category, discover curated blocks, and build your
                playlists.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user && (
                <>
                  <Link
                    href="/songs/likes"
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm text-finema-muted hover:text-finema-text transition-colors"
                  >
                    Liked Songs
                  </Link>
                  <Link
                    href="/songs/playlists"
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm text-finema-muted hover:text-finema-text transition-colors"
                  >
                    My Playlists
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-6">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs by title, artist, or description…"
              className="w-full max-w-xl rounded-lg border border-white/10 bg-finema-surface px-4 py-3 text-finema-text placeholder:text-finema-muted focus:border-finema-accent focus:outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                activeCategory === null
                  ? "bg-finema-accent text-white"
                  : "border border-white/10 text-finema-muted hover:text-finema-text"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  activeCategory === cat.id
                    ? "bg-finema-accent text-white"
                    : "border border-white/10 text-finema-muted hover:text-finema-text"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="mx-4 md:mx-8 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300 max-w-xl">
            {error}
          </div>
        ) : (
          <>
            {showBlocks && blocks.length > 0 && (
              <section className="px-4 md:px-8 max-w-[1920px] mx-auto mb-10">
                <h2 className="text-lg font-semibold text-finema-text mb-4">
                  Collections
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {blocks.map((block, index) => (
                    <SongBlockCard
                      key={block.id}
                      block={block}
                      index={index}
                      showLike={Boolean(user)}
                      liking={likingBlockId === block.id}
                      onLikeToggle={() => void handleBlockLikeToggle(block.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {showBlocks && (
              <section className="px-4 md:px-8 max-w-[1920px] mx-auto">
                <h2 className="text-lg font-semibold text-finema-text mb-4">
                  All Songs
                </h2>
                {songs.length === 0 ? (
                  <p className="text-finema-muted">No songs yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {songs.map((song) => (
                      <SongCard key={song.id} song={song} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {!showBlocks && (
              <section className="px-4 md:px-8 max-w-[1920px] mx-auto">
                <h2 className="text-lg font-semibold text-finema-text mb-4">
                  {search.trim() ? "Search results" : "Songs"}
                </h2>
                {songs.length === 0 ? (
                  <p className="text-finema-muted">No songs found.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {songs.map((song) => (
                      <SongCard key={song.id} song={song} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </motion.main>
    </div>
  );
}
