"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PosterWithStats, PublicUser } from "@/db/types";
import { likePoster, unlikePoster } from "@/lib/api-client";
import { slugifyTitle } from "@/lib/slug";

type ImageOrientation = "portrait" | "landscape" | "square";

interface PosterDetailModalProps {
  poster: PosterWithStats | null;
  open: boolean;
  user: PublicUser | null;
  onClose: () => void;
  onLikeChange: (posterId: string, likeCount: number, likedByMe: boolean) => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-5 w-5 ${filled ? "fill-finema-accent text-finema-accent" : "fill-none"}`}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 11.25 12 15.75m0 0 4.5-4.5M12 15.75V3"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function detectOrientation(width: number, height: number): ImageOrientation {
  if (height > width * 1.05) return "portrait";
  if (width > height * 1.05) return "landscape";
  return "square";
}

export function PosterDetailModal({
  poster,
  open,
  user,
  onClose,
  onLikeChange,
}: PosterDetailModalProps) {
  const [liking, setLiking] = useState(false);
  const [orientation, setOrientation] = useState<ImageOrientation>("portrait");

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setOrientation("portrait");
  }, [poster?.id, poster?.image_url]);

  async function handleLikeToggle() {
    if (!poster || !user || liking) return;
    setLiking(true);
    const wasLiked = poster.liked_by_me;
    const optimisticCount = wasLiked
      ? Math.max(0, poster.like_count - 1)
      : poster.like_count + 1;
    onLikeChange(poster.id, optimisticCount, !wasLiked);

    try {
      const result = wasLiked
        ? await unlikePoster(poster.id)
        : await likePoster(poster.id);
      onLikeChange(poster.id, result.like_count, result.liked_by_me);
    } catch {
      onLikeChange(poster.id, poster.like_count, poster.liked_by_me);
    } finally {
      setLiking(false);
    }
  }

  const downloadName = poster
    ? `${slugifyTitle(poster.title) || "poster"}.jpg`
    : "poster.jpg";

  const isPortrait = orientation === "portrait" || orientation === "square";

  return (
    <AnimatePresence>
      {open && poster && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="poster-modal-title"
            className={`flex w-full max-h-[95vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-finema-surface shadow-2xl md:flex-row ${
              isPortrait ? "max-w-5xl lg:max-w-6xl" : "max-w-6xl lg:max-w-7xl"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`relative shrink-0 overflow-hidden bg-black/60 ${
                isPortrait
                  ? "mx-auto w-full max-w-sm h-[min(58vh,640px)] md:mx-0 md:h-auto md:w-[min(40%,460px)] md:min-h-[min(92vh,860px)]"
                  : "h-[min(44vh,480px)] w-full md:h-auto md:w-[58%] md:min-h-[min(80vh,720px)]"
              }`}
            >
              <Image
                src={poster.image_url}
                alt={poster.title}
                fill
                sizes={
                  isPortrait
                    ? "(max-width: 768px) 90vw, 460px"
                    : "(max-width: 768px) 100vw, 720px"
                }
                className="object-contain"
                priority
                onLoad={(event) => {
                  const img = event.currentTarget;
                  setOrientation(
                    detectOrientation(img.naturalWidth, img.naturalHeight)
                  );
                }}
              />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                <h2
                  id="poster-modal-title"
                  className="text-2xl font-bold text-finema-text sm:text-3xl"
                >
                  {poster.title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg border border-white/10 p-2.5 text-finema-muted hover:border-white/30 hover:text-finema-text transition-colors touch-manipulation"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-finema-muted">
                  Description
                </h3>
                {poster.description ? (
                  <p className="text-base leading-relaxed text-finema-text whitespace-pre-wrap">
                    {poster.description}
                  </p>
                ) : (
                  <p className="text-base text-finema-muted italic">
                    No description provided.
                  </p>
                )}
              </div>

              <div className="shrink-0 border-t border-white/10 bg-finema-surface/95 px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-finema-muted">
                      Likes
                    </span>
                    {user ? (
                      <button
                        type="button"
                        onClick={() => void handleLikeToggle()}
                        disabled={liking}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-finema-text hover:border-white/30 transition-colors disabled:opacity-50 touch-manipulation"
                        aria-label={
                          poster.liked_by_me ? "Unlike poster" : "Like poster"
                        }
                      >
                        <HeartIcon filled={poster.liked_by_me} />
                        <span>{poster.like_count}</span>
                      </button>
                    ) : (
                      <Link
                        href="/login?redirect=/posters"
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-finema-muted hover:border-white/30 hover:text-finema-text transition-colors touch-manipulation"
                        title="Sign in to like"
                      >
                        <HeartIcon filled={false} />
                        <span>{poster.like_count}</span>
                      </Link>
                    )}
                  </div>

                  <a
                    href={poster.image_url}
                    download={downloadName}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-finema-accent px-6 py-3 text-sm font-medium text-white hover:bg-red-600 transition-colors touch-manipulation"
                  >
                    <DownloadIcon />
                    Download Poster
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
