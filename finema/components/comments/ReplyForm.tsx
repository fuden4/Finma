"use client";

import type { MovieComment, SeriesComment } from "@/db/types";
import { CommentComposer } from "@/components/comments/CommentComposer";

interface ReplyFormProps {
  movieId?: string;
  seriesId?: string;
  parentId: string;
  onPosted: (comment: MovieComment | SeriesComment) => void;
  onCancel: () => void;
}

export function ReplyForm({
  movieId,
  seriesId,
  parentId,
  onPosted,
  onCancel,
}: ReplyFormProps) {
  return (
    <div className="mt-3">
      <CommentComposer
        movieId={movieId}
        seriesId={seriesId}
        parentId={parentId}
        placeholder="Write a reply..."
        rows={2}
        submitLabel="Reply"
        compact
        onPosted={onPosted}
        onCancel={onCancel}
      />
    </div>
  );
}
