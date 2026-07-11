"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import type { PublicUser, SongCategory, SongWithStats } from "@/db/types";
import { getMe, getSongCategory } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { SongCard } from "@/components/songs/SongCard";

export default function SongCategoryPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [category, setCategory] = useState<SongCategory | null>(null);
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    Promise.all([getMe(), getSongCategory(params.id)])
      .then(([me, res]) => {
        setUser(me?.user ?? null);
        setCategory(res.category);
        setSongs(res.songs);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load category")
      )
      .finally(() => setLoading(false));
  }, [params.id]);

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
        ) : error || !category ? (
          <p className="mt-6 text-red-300">{error || "Category not found"}</p>
        ) : (
          <>
            <h1 className="mt-4 text-3xl font-bold text-finema-text">{category.name}</h1>
            {category.description && (
              <p className="mt-2 text-finema-muted max-w-2xl">{category.description}</p>
            )}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {songs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </>
        )}
      </motion.main>
    </div>
  );
}
