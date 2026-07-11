import { SongForm } from "@/components/admin/SongForm";

export default function NewSongPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Add Song</h2>
      <SongForm mode="create" />
    </div>
  );
}
