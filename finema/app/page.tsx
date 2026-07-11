import { listMovies, listPosters, listSeries, listSongs } from "@/db/queries";
import type { Movie } from "@/db/types";
import { HomeContent } from "@/components/home/HomeContent";
import { getSession } from "@/lib/session";

const HOME_ROW_LIMIT = 12;

function pickFeatured(movies: Movie[], count = 5): Movie[] {
  return [...movies]
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, count);
}

export default async function HomePage() {
  const session = await getSession();
  const userId = session.userId;

  const [movies, series, songs, posters] = await Promise.all([
    listMovies(),
    listSeries(),
    listSongs(userId, { limit: HOME_ROW_LIMIT }),
    listPosters(userId),
  ]);
  const featured = pickFeatured(movies);

  return (
    <HomeContent
      movies={movies}
      series={series}
      featured={featured}
      songs={songs}
      posters={posters.slice(0, HOME_ROW_LIMIT)}
    />
  );
}
