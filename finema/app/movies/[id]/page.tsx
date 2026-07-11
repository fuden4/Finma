import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  findUserById,
  getMovieById,
  getUserMovieRating,
  getWatchlistMovieIds,
  isInWatchlist,
  listMovies,
  recordMovieView,
} from "@/db/queries";
import { MovieDetailContent } from "@/components/movies/MovieDetailContent";
import { getSession } from "@/lib/session";
import { moviePath } from "@/lib/content-paths";
import { isUuid } from "@/lib/slug";

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
  const movie = await getMovieById(id);

  if (!movie) {
    notFound();
  }

  if (isUuid(id)) {
    redirect(moviePath(movie));
  }

  const [allMovies, user, inWatchlist, watchlistIds, userRating] =
    await Promise.all([
      listMovies(),
      session.userId ? findUserById(session.userId) : Promise.resolve(null),
      session.userId
        ? isInWatchlist(session.userId, movie.id)
        : Promise.resolve(false),
      session.userId
        ? getWatchlistMovieIds(session.userId)
        : Promise.resolve([]),
      session.userId
        ? getUserMovieRating(session.userId, movie.id)
        : Promise.resolve(null),
    ]);

  if (user) {
    await recordMovieView(user.id, movie.id);
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
