import { listMovies } from "@/db/queries";
import type { Movie } from "@/db/types";
import { HomeContent } from "@/components/home/HomeContent";

function pickFeatured(movies: Movie[], count = 5): Movie[] {
  return [...movies]
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, count);
}

export default async function HomePage() {
  const movies = await listMovies();
  const featured = pickFeatured(movies);

  return <HomeContent movies={movies} featured={featured} />;
}
