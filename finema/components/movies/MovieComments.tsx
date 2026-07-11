"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { MovieComment, PublicUser, SeriesComment } from "@/db/types";
import { getMovieComments } from "@/lib/api-client";
import { isRegularUser } from "@/lib/user-utils";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { CommentItem } from "@/components/comments/CommentItem";
import { DeleteCommentModal } from "@/components/comments/DeleteCommentModal";
import { ReportCommentModal } from "@/components/comments/ReportCommentModal";
import { useCommentMediaFavorites } from "@/components/comments/useCommentMediaFavorites";

interface MovieCommentsProps {
  movieId: string;
  user: PublicUser | null;
  currentUserRating?: number | null;
}

export function MovieComments({ movieId, user, currentUserRating }: MovieCommentsProps) {
  const [comments, setComments] = useState<MovieComment[]>([]);
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
        const data = await getMovieComments(movieId);
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
  }, [movieId]);

  function handleReplyPosted(parentId: string, reply: MovieComment | SeriesComment) {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies ?? []), reply as MovieComment],
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
            movieId={movieId}
            onPosted={(comment) => {
              setComments((prev) => [comment as MovieComment, ...prev]);
            }}
          />
        </div>
      ) : !user ? (
        <p className="mb-8 text-finema-muted">
          <Link
            href="/login"
            className="text-finema-accent hover:underline"
          >
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
        <p className="text-finema-muted">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                movieId={movieId}
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
