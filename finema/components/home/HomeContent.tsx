"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { ContinueWatchingItem, Movie, PublicUser, Series, WatchlistItem } from "@/db/types";
import { getContinueWatching, getMe, getRecommendations, getWatchlist, getSeriesWatchlist } from "@/lib/api-client";
import { groupMoviesByGenre } from "@/lib/movie-utils";
import { isRegularUser } from "@/lib/user-utils";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "./HeroSection";
import { MovieRow } from "./MovieRow";
import { ContinueWatchingRow } from "./ContinueWatchingRow";
import { WatchlistRow } from "./WatchlistRow";
import { SeriesRow } from "./SeriesRow";

interface HomeContentProps {
  movies: Movie[];
  series: Series[];
  featured: Movie[];
}

export function HomeContent({ movies, series, featured }: HomeContentProps) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [continueItems, setContinueItems] = useState<ContinueWatchingItem[]>(
    []
  );
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [recommendedSeries, setRecommendedSeries] = useState<Series[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [seriesWatchlistIds, setSeriesWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadAuth = useCallback(async () => {
    const me = await getMe();
    setUser(me?.user ?? null);
    if (me?.user && isRegularUser(me.user)) {
      try {
        const [cw, wl, rec, swl] = await Promise.all([
          getContinueWatching(),
          getWatchlist(),
          getRecommendations(),
          getSeriesWatchlist().catch(() => ({ items: [] })),
        ]);
        setContinueItems(cw.items);
        setWatchlistItems(wl.items);
        setWatchlistIds(new Set(wl.items.map((item) => item.id)));
        setSeriesWatchlistIds(new Set(swl.items.map((item) => item.id)));
        setRecommended(rec.movies);
        setRecommendedSeries(rec.series);
      } catch {
        setContinueItems([]);
        setWatchlistItems([]);
        setWatchlistIds(new Set());
        setSeriesWatchlistIds(new Set());
        setRecommended([]);
        setRecommendedSeries([]);
      }
    } else {
      setContinueItems([]);
      setWatchlistItems([]);
      setWatchlistIds(new Set());
      setSeriesWatchlistIds(new Set());
      setRecommended([]);
      setRecommendedSeries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAuth();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAuth]);

  function handleWatchlistChange(movieId: string, inWatchlist: boolean) {
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (inWatchlist) {
        next.add(movieId);
      } else {
        next.delete(movieId);
      }
      return next;
    });

    if (inWatchlist) {
      const movie = movies.find((m) => m.id === movieId);
      if (movie) {
        setWatchlistItems((prev) => {
          if (prev.some((item) => item.id === movieId)) return prev;
          return [
            { ...movie, added_at: new Date().toISOString() },
            ...prev,
          ];
        });
      }
    } else {
      setWatchlistItems((prev) => prev.filter((item) => item.id !== movieId));
    }
  }

  const genreMap = groupMoviesByGenre(movies);
  const regularUser = isRegularUser(user) ? user : null;

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} onAuthChange={loadAuth} />
      <HeroSection
        movies={featured}
        user={regularUser}
        watchlistIds={watchlistIds}
        onWatchlistChange={handleWatchlistChange}
      />

      <div className="relative z-10 bg-finema-bg pt-4">
        {!loading && !user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-3 sm:mx-4 md:mx-8 mb-8 px-4 py-3 rounded-lg bg-finema-surface border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
          >
            <p className="text-sm text-finema-muted">
              Sign in to save your progress and unlock Continue Watching.{" "}
              <Link href="/signup" className="text-finema-accent hover:underline">
                Create account
              </Link>
            </p>
            <Link
              href="/login"
              className="text-sm px-4 py-2.5 rounded bg-finema-accent text-white font-medium hover:bg-finema-accent/90 transition-colors shrink-0 text-center touch-manipulation"
            >
              Sign In
            </Link>
          </motion.div>
        )}

        {regularUser && continueItems.length > 0 && (
          <ContinueWatchingRow items={continueItems} />
        )}

        {regularUser && watchlistItems.length > 0 && (
          <WatchlistRow
            items={watchlistItems}
            user={regularUser}
            onWatchlistChange={handleWatchlistChange}
          />
        )}

        <MovieRow
          title="Trending Now"
          movies={movies}
          user={regularUser}
          watchlistIds={watchlistIds}
          showWatchlistButton={!!regularUser}
          onWatchlistChange={handleWatchlistChange}
        />

        {series.length > 0 && (
          <SeriesRow
            title="TV Series"
            series={series}
            user={regularUser}
            watchlistIds={seriesWatchlistIds}
            showWatchlistButton={!!regularUser}
            onWatchlistChange={(seriesId, inWatchlist) => {
              setSeriesWatchlistIds((prev) => {
                const next = new Set(prev);
                if (inWatchlist) {
                  next.add(seriesId);
                } else {
                  next.delete(seriesId);
                }
                return next;
              });
            }}
          />
        )}

        {regularUser && recommended.length > 0 && (
          <MovieRow
            title="Recommended for you"
            movies={recommended}
            user={regularUser}
            watchlistIds={watchlistIds}
            showWatchlistButton
            onWatchlistChange={handleWatchlistChange}
          />
        )}

        {regularUser && recommendedSeries.length > 0 && (
          <SeriesRow
            title="Series picks for you"
            series={recommendedSeries}
            user={regularUser}
            watchlistIds={seriesWatchlistIds}
            showWatchlistButton
            onWatchlistChange={(seriesId, inWatchlist) => {
              setSeriesWatchlistIds((prev) => {
                const next = new Set(prev);
                if (inWatchlist) {
                  next.add(seriesId);
                } else {
                  next.delete(seriesId);
                }
                return next;
              });
            }}
          />
        )}

        {Array.from(genreMap.entries()).map(([genre, genreMovies]) => (
          <MovieRow
            key={genre}
            title={genre}
            movies={genreMovies}
            user={regularUser}
            watchlistIds={watchlistIds}
            showWatchlistButton={!!regularUser}
            onWatchlistChange={handleWatchlistChange}
          />
        ))}
      </div>
    </div>
  );
}
