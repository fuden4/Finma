import { MovieForm } from "@/components/admin/MovieForm";

export default function NewMoviePage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Add Movie</h2>
      <MovieForm mode="create" />
    </div>
  );
}
