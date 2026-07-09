"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PublicUser } from "@/db/types";
import { addToWatchlist, removeFromWatchlist } from "@/lib/api-client";

interface WatchlistButtonProps {
  movieId: string;
  initialInWatchlist: boolean;
  variant: "detail" | "card";
  user?: PublicUser | null;
  onChange?: (inWatchlist: boolean) => void;
}

export function WatchlistButton({
  movieId,
  initialInWatchlist,
  variant,
  user,
  onChange,
}: WatchlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInWatchlist(initialInWatchlist);
  }, [initialInWatchlist]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const redirect = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    const next = !inWatchlist;
    setInWatchlist(next);
    setLoading(true);

    try {
      if (next) {
        await addToWatchlist(movieId);
      } else {
        await removeFromWatchlist(movieId);
      }
      onChange?.(next);
    } catch {
      setInWatchlist(!next);
    } finally {
      setLoading(false);
    }
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
        className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-60 ${
          inWatchlist
            ? "bg-white text-black"
            : "bg-black/60 text-white border border-white/30 hover:bg-black/80"
        }`}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : inWatchlist ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={loading}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded font-semibold transition-colors disabled:opacity-60 ${
        inWatchlist
          ? "bg-white text-black hover:bg-white/90"
          : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
      }`}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : inWatchlist ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      )}
      {inWatchlist ? "In My List" : "My List"}
    </motion.button>
  );
}
