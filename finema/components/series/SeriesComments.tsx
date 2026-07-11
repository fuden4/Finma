"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { MovieComment, PublicUser, SeriesComment } from "@/db/types";
import { getSeriesComments } from "@/lib/api-client";
import { isRegularUser } from "@/lib/user-utils";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { CommentItem } from "@/components/comments/CommentItem";
import { DeleteCommentModal } from "@/components/comments/DeleteCommentModal";
import { ReportCommentModal } from "@/components/comments/ReportCommentModal";
import { useCommentMediaFavorites } from "@/components/comments/useCommentMediaFavorites";

interface SeriesCommentsProps {
  seriesId: string;
  user: PublicUser | null;
  currentUserRating?: number | null;
}

function toMovieCommentShape(comment: SeriesComment): MovieComment {
  return {
    id: comment.id,
    movie_id: comment.series_id,
    user_id: comment.user_id,
    parent_id: comment.parent_id,
    body: comment.body,
    media_type: comment.media_type,
    media_url: comment.media_url,
    created_at: comment.created_at,
    display_name: comment.display_name,
    avatar_url: comment.avatar_url,
    user_rating: comment.user_rating,
    replies: comment.replies?.map(toMovieCommentShape),
  };
}

export function SeriesComments({
  seriesId,
  user,
  currentUserRating,
}: SeriesCommentsProps) {
  const [comments, setComments] = useState<SeriesComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  const canInteract = isRegularUser(user);
  const { favoriteUrls, toggleFavorite } = useCommentMediaFavorites(canInteract);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        const data = await getSeriesComments(seriesId);
        if (!cancelled) {
          setComments(data.comments);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load comments");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadComments();
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  function handleReplyPosted(parentId: string, reply: MovieComment | SeriesComment) {
    const seriesReply =
      "series_id" in reply
        ? reply
        : ({ ...reply, series_id: seriesId } as SeriesComment);
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies ?? []), seriesReply],
            }
          : comment
      )
    );
  }

  function handleCommentDeleted(commentId: string) {
    setComments((prev) =>
      prev
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
          ...comment,
          replies: comment.replies?.filter((reply) => reply.id !== commentId),
        }))
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55 }}
      className="px-4 md:px-8 pb-10 max-w-3xl mx-auto"
    >
      <h2 className="text-lg font-semibold text-finema-text mb-4">Comments</h2>

      {canInteract ? (
        <div className="mb-8">
          <CommentComposer
            seriesId={seriesId}
            placeholder="Share your thoughts about this series..."
            onPosted={(comment) => {
              const seriesComment =
                "series_id" in comment
                  ? comment
                  : ({ ...comment, series_id: seriesId } as SeriesComment);
              setComments((prev) => [seriesComment, ...prev]);
            }}
          />
        </div>
      ) : !user ? (
        <p className="mb-8 text-finema-muted">
          <Link href="/login" className="text-finema-accent hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      ) : null}

      {error && (
        <p className="mb-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {reportSuccess && (
        <p className="mb-4 text-sm text-green-400" role="status">
          Report submitted. Thank you for helping keep our community safe.
        </p>
      )}

      {loading ? (
        <p className="text-finema-muted">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-finema-muted">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={toMovieCommentShape(comment)}
                seriesId={seriesId}
                user={user}
                currentUserRating={currentUserRating}
                canInteract={canInteract}
                onReplyPosted={handleReplyPosted}
                onReport={setReportCommentId}
                onRequestDelete={setDeleteCommentId}
                favoriteMediaUrls={favoriteUrls}
                onToggleMediaFavorite={toggleFavorite}
              />
            </li>
          ))}
        </ul>
      )}

      <DeleteCommentModal
        open={deleteCommentId !== null}
        commentId={deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        onDeleted={handleCommentDeleted}
      />

      <ReportCommentModal
        open={reportCommentId !== null}
        commentId={reportCommentId}
        onClose={() => setReportCommentId(null)}
        onReported={() => setReportSuccess(true)}
      />
    </motion.section>
  );
}
