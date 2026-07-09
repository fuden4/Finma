"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PublicUser, UserCommentItem } from "@/db/types";
import { deleteMyComment, getMyComments } from "@/lib/api-client";
import { Navbar } from "@/components/layout/Navbar";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";

interface MyCommentsContentProps {
  user: PublicUser;
}

function formatCommentDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function MyCommentsContent({ user }: MyCommentsContentProps) {
  const [comments, setComments] = useState<UserCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getMyComments();
        if (!cancelled) setComments(result.comments);
      } catch {
        if (!cancelled) {
          setError("Failed to load your comments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(commentId: string) {
    if (deletingId) return;

    const previous = comments;
    setDeletingId(commentId);
    setError(null);
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));

    try {
      await deleteMyComment(commentId);
    } catch {
      setComments(previous);
      setError("Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-finema-bg">
      <Navbar user={user} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-24 px-4 md:px-8 pb-16 max-w-[1280px] mx-auto"
      >
        <h1 className="text-3xl font-bold text-finema-text mb-2">My Comments</h1>
        <p className="text-finema-muted mb-8">
          Review and manage comments you posted on movies.
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-finema-accent border-t-transparent animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-finema-surface/40 p-12 text-center">
            <p className="text-lg text-finema-text mb-2">
              You haven&apos;t written any comments yet
            </p>
            <p className="text-finema-muted mb-6">
              Join the discussion on a movie page to see your comments here.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors"
            >
              Browse movies
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-xl border border-white/10 bg-finema-surface/40 p-4 md:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Link
                        href={`/movies/${comment.movie_id}`}
                        className="font-semibold text-finema-text hover:text-finema-accent transition-colors"
                      >
                        {comment.movie_title}
                      </Link>
                      {comment.user_rating != null && (
                        <StarRatingDisplay value={comment.user_rating} size="sm" />
                      )}
                      <time
                        dateTime={comment.created_at}
                        className="text-xs text-finema-muted"
                      >
                        {formatCommentDate(comment.created_at)}
                      </time>
                    </div>
                    <p className="text-finema-muted whitespace-pre-wrap leading-relaxed">
                      {comment.body}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={deletingId === comment.id}
                    onClick={() => void handleDelete(comment.id)}
                    className="text-xs px-3 py-1.5 rounded border border-white/20 text-finema-muted hover:text-finema-text hover:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === comment.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.main>
    </div>
  );
}
