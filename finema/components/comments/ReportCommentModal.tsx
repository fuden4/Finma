"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { reportComment } from "@/lib/api-client";

interface ReportCommentModalProps {
  open: boolean;
  commentId: string | null;
  onClose: () => void;
  onReported: () => void;
}

export function ReportCommentModal({
  open,
  commentId,
  onClose,
  onReported,
}: ReportCommentModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (open && event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!commentId || submitting) return;

    const trimmed = reason.trim();
    if (trimmed.length < 1) return;

    setSubmitting(true);
    setError(null);

    try {
      await reportComment(commentId, trimmed);
      onReported();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && commentId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm p-4 flex items-start justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mt-24 w-full max-w-md rounded-xl border border-white/10 bg-finema-surface/95 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="p-5">
              <h3 className="text-lg font-semibold text-finema-text mb-1">
                Report comment
              </h3>
              <p className="text-sm text-finema-muted mb-4">
                Tell us why you are reporting this comment. An admin will review
                your report.
              </p>

              <textarea
                autoFocus
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe the issue..."
                rows={4}
                maxLength={1000}
                className="w-full rounded-lg border border-white/10 bg-finema-surface/40 px-4 py-3 text-finema-text placeholder:text-finema-muted focus:outline-none focus:border-finema-accent/50 resize-y"
              />

              <div className="mt-1 text-xs text-finema-muted">
                {reason.length}/1000
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded text-finema-muted hover:text-finema-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || reason.trim().length === 0}
                  className="px-4 py-2 text-sm rounded bg-finema-accent text-white font-medium hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
