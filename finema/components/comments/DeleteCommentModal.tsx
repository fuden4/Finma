"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { deleteMyComment } from "@/lib/api-client";

interface DeleteCommentModalProps {
  open: boolean;
  commentId: string | null;
  onClose: () => void;
  onDeleted: (commentId: string) => void;
}

type ModalPhase = "confirm" | "deleting" | "success";

export function DeleteCommentModal({
  open,
  commentId,
  onClose,
  onDeleted,
}: DeleteCommentModalProps) {
  const [phase, setPhase] = useState<ModalPhase>("confirm");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase("confirm");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (phase !== "success") return;

    const timer = window.setTimeout(() => {
      if (commentId) onDeleted(commentId);
      onClose();
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [phase, commentId, onDeleted, onClose]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!open || phase === "deleting" || phase === "success") return;
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, phase, onClose]);

  async function handleConfirm() {
    if (!commentId || phase !== "confirm") return;

    setPhase("deleting");
    setError(null);

    try {
      await deleteMyComment(commentId);
      setPhase("success");
    } catch (err) {
      setPhase("confirm");
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  }

  return (
    <AnimatePresence>
      {open && commentId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={phase === "confirm" ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-finema-surface shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {phase === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center px-6 py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 18,
                      delay: 0.05,
                    }}
                    className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 ring-4 ring-green-500/20"
                  >
                    <motion.svg
                      aria-hidden="true"
                      className="h-10 w-10 text-green-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
                    >
                      <motion.path d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.25 }}
                    className="text-lg font-semibold text-finema-text"
                  >
                    Comment deleted
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.25 }}
                    className="mt-1 text-sm text-finema-muted"
                  >
                    Your comment has been removed.
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                    <svg
                      aria-hidden="true"
                      className="h-6 w-6 text-red-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-finema-text">
                    Delete comment?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-finema-muted">
                    This action cannot be undone. Your comment will be permanently
                    removed from this movie.
                  </p>

                  {error && (
                    <p className="mt-3 text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={phase === "deleting"}
                      onClick={onClose}
                      className="rounded-lg px-4 py-2 text-sm text-finema-muted transition-colors hover:text-finema-text disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={phase === "deleting"}
                      onClick={() => void handleConfirm()}
                      className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {phase === "deleting" ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
