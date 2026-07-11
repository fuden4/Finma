"use client";

import type { MovieComment } from "@/db/types";
import { CommentComposer } from "@/components/comments/CommentComposer";

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
  return (
    <div className="mt-3">
      <CommentComposer
        movieId={movieId}
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
