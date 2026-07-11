import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  findUserById,
  getSeriesById,
  getSeriesWatchlistIds,
  getUserSeriesRating,
  isSeriesInWatchlist,
  listSeries,
  recordSeriesView,
} from "@/db/queries";
import { SeriesDetailContent } from "@/components/series/SeriesDetailContent";
import { getSession } from "@/lib/session";

interface SeriesPageProps {
  params: Promise<{ id: string }>;
}

function getRecommendations(
  currentId: string,
  currentGenres: string[],
  allSeries: Awaited<ReturnType<typeof listSeries>>
) {
  return allSeries
    .filter((s) => s.id !== currentId)
    .sort((a, b) => {
      const aShared = a.genres.filter((g) => currentGenres.includes(g)).length;
      const bShared = b.genres.filter((g) => currentGenres.includes(g)).length;
      if (bShared !== aShared) return bShared - aShared;
      return (b.match_score ?? 0) - (a.match_score ?? 0);
    })
    .slice(0, 8);
}

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { id } = await params;
  const series = await getSeriesById(id);
  if (!series) return { title: "Series Not Found | Finema" };
  return {
    title: `${series.title} | Finema`,
    description: series.description ?? undefined,
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { id } = await params;
  const session = await getSession();
  const [series, allSeries, user, inWatchlist, seriesWatchlistIds, userRating] =
    await Promise.all([
      getSeriesById(id),
      listSeries(),
      session.userId ? findUserById(session.userId) : Promise.resolve(null),
      session.userId
        ? isSeriesInWatchlist(session.userId, id)
        : Promise.resolve(false),
      session.userId
        ? getSeriesWatchlistIds(session.userId)
        : Promise.resolve([]),
      session.userId
        ? getUserSeriesRating(session.userId, id)
        : Promise.resolve(null),
    ]);

  if (!series) {
    notFound();
  }

  if (user) {
    await recordSeriesView(user.id, id);
  }

  const recommendations = getRecommendations(series.id, series.genres, allSeries);

  return (
    <SeriesDetailContent
      series={series}
      recommendations={recommendations}
      user={user}
      inWatchlist={inWatchlist}
      seriesWatchlistIds={seriesWatchlistIds}
      userRating={userRating}
    />
  );
}
