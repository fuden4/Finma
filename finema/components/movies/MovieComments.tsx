"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { MovieComment, PublicUser } from "@/db/types";
import { getMovieComments, postMovieComment } from "@/lib/api-client";
import { isRegularUser } from "@/lib/user-utils";
import { CommentItem } from "@/components/comments/CommentItem";
import { ReportCommentModal } from "@/components/comments/ReportCommentModal";

interface MovieCommentsProps {
  movieId: string;
  user: PublicUser | null;
  currentUserRating?: number | null;
}

export function MovieComments({ movieId, user, currentUserRating }: MovieCommentsProps) {
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  const canInteract = isRegularUser(user);

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

  function handleReplyPosted(parentId: string, reply: MovieComment) {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies ?? []), reply],
            }
          : comment
      )
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    setError(null);

    try {
      const result = await postMovieComment(movieId, trimmed);
      setComments((prev) => [result.comment, ...prev]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
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
        <form onSubmit={handleSubmit} className="mb-8 space-y-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share your thoughts about this movie..."
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-white/10 bg-finema-surface/40 px-4 py-3 text-finema-text placeholder:text-finema-muted focus:outline-none focus:border-finema-accent/50 resize-y"
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-finema-muted">
              {body.length}/2000
            </span>
            <button
              type="submit"
              disabled={posting || body.trim().length === 0}
              className="px-5 py-2 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {posting ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
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
              />
            </li>
          ))}
        </ul>
      )}

      <ReportCommentModal
        open={reportCommentId !== null}
        commentId={reportCommentId}
        onClose={() => setReportCommentId(null)}
        onReported={() => setReportSuccess(true)}
      />
    </motion.section>
  );
}
