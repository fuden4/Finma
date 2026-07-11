import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { SongDetailContent } from "@/components/songs/SongDetailContent";
import { getSongById, listRelatedSongs } from "@/db/queries";
import { songPath } from "@/lib/content-paths";
import { isUuid } from "@/lib/slug";

interface SongPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SongPageProps): Promise<Metadata> {
  const { id } = await params;
  const song = await getSongById(id);
  if (!song) return { title: "Song Not Found | Finema" };
  return {
    title: `${song.title} | Finema`,
    description: song.description ?? song.artist ?? undefined,
  };
}

export default async function SongPage({ params }: SongPageProps) {
  const { id } = await params;
  const song = await getSongById(id);
  if (!song) notFound();

  if (isUuid(id)) {
    redirect(songPath(song));
  }

  const related = await listRelatedSongs(song.id, song.category_id);

  return <SongDetailContent songId={song.id} relatedSongs={related} />;
}
