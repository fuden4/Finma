import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findUserById, getMovieById, getUserMovieRating, getWatchlistMovieIds, isInWatchlist, listMovies, recordMovieView } from "@/db/queries";
import { MovieDetailContent } from "@/components/movies/MovieDetailContent";
import { getSession } from "@/lib/session";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

function getRecommendations(
  currentId: string,
  currentGenres: string[],
  movies: Awaited<ReturnType<typeof listMovies>>
) {
  return movies
    .filter((m) => m.id !== currentId)
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
}: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieById(id);
  if (!movie) return { title: "Movie Not Found | Finema" };
  return {
    title: `${movie.title} | Finema`,
    description: movie.description ?? undefined,
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const session = await getSession();
  const [movie, allMovies, user, inWatchlist, watchlistIds, userRating] =
    await Promise.all([
    getMovieById(id),
    listMovies(),
    session.userId ? findUserById(session.userId) : Promise.resolve(null),
    session.userId
      ? isInWatchlist(session.userId, id)
      : Promise.resolve(false),
    session.userId
      ? getWatchlistMovieIds(session.userId)
      : Promise.resolve([]),
    session.userId
      ? getUserMovieRating(session.userId, id)
      : Promise.resolve(null),
  ]);

  if (!movie) {
    notFound();
  }

  if (user) {
    await recordMovieView(user.id, id);
  }

  const recommendations = getRecommendations(movie.id, movie.genres, allMovies);

  return (
    <MovieDetailContent
      movie={movie}
      recommendations={recommendations}
      user={user}
      inWatchlist={inWatchlist}
      watchlistIds={watchlistIds}
      userRating={userRating}
    />
  );
}
