"use client";

import { useState } from "react";
import type { MovieComment, PublicUser } from "@/db/types";
import { CommentItem } from "@/components/comments/CommentItem";

interface ReplyListProps {
  replies: MovieComment[];
  parentDisplayName: string;
  movieId: string;
  user: PublicUser | null;
  currentUserRating?: number | null;
  canInteract: boolean;
  onReplyPosted: (parentId: string, reply: MovieComment) => void;
  onReport: (commentId: string) => void;
}

export function ReplyList({
  replies,
  parentDisplayName,
  movieId,
  user,
  currentUserRating,
  canInteract,
  onReplyPosted,
  onReport,
}: ReplyListProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleReplies = expanded || replies.length <= 1 ? replies : replies.slice(0, 1);
  const hiddenCount = replies.length - 1;

  return (
    <div>
      {visibleReplies.map((reply, index) => (
        <div
          key={reply.id}
          className={index > 0 ? "border-t border-white/5" : undefined}
        >
          <CommentItem
            comment={reply}
            movieId={movieId}
            user={user}
            currentUserRating={currentUserRating}
            canInteract={canInteract}
            isReply
            parentDisplayName={parentDisplayName}
            onReplyPosted={onReplyPosted}
            onReport={onReport}
          />
        </div>
      ))}

      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="py-2 pl-4 text-sm text-finema-accent hover:underline"
        >
          Show {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
        </button>
      )}
    </div>
  );
}
