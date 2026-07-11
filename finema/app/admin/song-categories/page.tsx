"use client";

import { useEffect, useState } from "react";
import type { SongCategory } from "@/db/types";
import {
  createAdminSongCategory,
  deleteAdminSongCategory,
  getAdminSongCategories,
} from "@/lib/api-client";

export default function AdminSongCategoriesPage() {
  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    getAdminSongCategories()
      .then(({ categories: list }) => setCategories(list))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createAdminSongCategory({
        name: name.trim(),
        description: description.trim() || null,
      });
      setName("");
      setDescription("");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteAdminSongCategory(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Song Categories</h2>
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleCreate} className="mb-8 max-w-lg space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-finema-accent text-white text-sm hover:bg-red-600"
        >
          Add Category
        </button>
      </form>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"
            >
              <div>
                <p className="font-medium">{cat.name}</p>
                {cat.description && (
                  <p className="text-sm text-finema-muted">{cat.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                className="text-sm text-red-400 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
