import { PosterForm } from "@/components/admin/PosterForm";

export default function NewPosterPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Add Poster</h2>
      <PosterForm mode="create" />
    </div>
  );
}
