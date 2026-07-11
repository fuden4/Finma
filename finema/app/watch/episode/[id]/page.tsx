import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEpisodeById } from "@/db/queries";
import { WatchPlayer } from "@/components/player/WatchPlayer";
import type { MovieDetail } from "@/db/types";

interface WatchEpisodePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: WatchEpisodePageProps): Promise<Metadata> {
  const { id } = await params;
  const episode = await getEpisodeById(id);
  if (!episode) return { title: "Episode Not Found | Finema" };
  return {
    title: `${episode.series_title} - ${episode.title} | Finema`,
  };
}

export default async function WatchEpisodePage({ params }: WatchEpisodePageProps) {
  const { id } = await params;
  const episode = await getEpisodeById(id);

  if (!episode || !episode.hls_playlist_url) {
    notFound();
  }

  const playable: MovieDetail = {
    id: episode.id,
    title: `${episode.series_title} · S${episode.season_number}E${episode.episode_number}: ${episode.title}`,
    description: episode.description,
    release_year: null,
    duration_seconds: episode.duration_seconds,
    poster_url: episode.thumbnail_url,
    backdrop_url: null,
    match_score: null,
    genres: [],
    hls_playlist_url: episode.hls_playlist_url,
    quality_label: episode.quality_label,
  };

  return (
    <WatchPlayer
      movie={playable}
      episodeId={episode.id}
      backHref={`/series/${episode.series_id}`}
    />
  );
}
