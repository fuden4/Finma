import { notFound } from "next/navigation";
import { getMovieById } from "@/db/queries";
import { WatchPlayer } from "@/components/player/WatchPlayer";

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  const movie = await getMovieById(id);

  if (!movie || !movie.hls_playlist_url) {
    notFound();
  }

  return <WatchPlayer movie={movie} />;
}
