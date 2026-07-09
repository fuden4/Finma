"use client";

import { useState } from "react";
import { postMovieComment } from "@/lib/api-client";
import type { MovieComment } from "@/db/types";

interface ReplyFormProps {
  movieId: string;
  parentId: string;
  onPosted: (comment: MovieComment) => void;
  onCancel: () => void;
}

export function ReplyForm({
  movieId,
  parentId,
  onPosted,
  onCancel,
}: ReplyFormProps) {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    setError(null);

    try {
      const result = await postMovieComment(movieId, trimmed, parentId);
      onPosted(result.comment);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setPosting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write a reply..."
        rows={2}
        maxLength={2000}
        autoFocus
        className="w-full rounded-lg border border-white/10 bg-finema-surface/40 px-3 py-2 text-sm text-finema-text placeholder:text-finema-muted focus:outline-none focus:border-finema-accent/50 resize-y"
      />
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={posting || body.trim().length === 0}
          className="px-3 py-1.5 text-sm rounded bg-finema-accent text-white font-medium hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {posting ? "Posting..." : "Reply"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm rounded text-finema-muted hover:text-finema-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
