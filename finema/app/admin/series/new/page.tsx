import { SeriesForm } from "@/components/admin/SeriesForm";

export default function NewSeriesPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Add Series or Episode</h2>
      <SeriesForm mode="create" />
    </div>
  );
}
