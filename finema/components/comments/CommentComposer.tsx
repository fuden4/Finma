"use client";

import { useState } from "react";
import type { MovieComment, SeriesComment } from "@/db/types";
import { postMovieComment, postSeriesComment } from "@/lib/api-client";
import { GifPicker, type SelectedGif } from "@/components/comments/GifPicker";
import {
  StickerPicker,
  type SelectedSticker,
} from "@/components/comments/StickerPicker";

export type CommentMediaSelection = SelectedGif | SelectedSticker;

interface CommentComposerProps {
  movieId?: string;
  seriesId?: string;
  parentId?: string | null;
  placeholder?: string;
  rows?: number;
  submitLabel?: string;
  onPosted: (comment: MovieComment | SeriesComment) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function CommentComposer({
  movieId,
  seriesId,
  parentId = null,
  placeholder = "Share your thoughts...",
  rows = 3,
  submitLabel = "Post comment",
  onPosted,
  onCancel,
  compact = false,
}: CommentComposerProps) {
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<CommentMediaSelection | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);

  const canSubmit = (body.trim().length > 0 || media !== null) && !posting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setPosting(true);
    setError(null);

    try {
      const mediaPayload = media
        ? {
            type: media.type,
            url: media.url,
            previewUrl:
              media.type === "gif" ? media.previewUrl : media.url,
            giphyId: media.type === "gif" ? media.giphyId : undefined,
            label: media.type === "sticker" ? media.label : undefined,
          }
        : null;

      const result = seriesId
        ? await postSeriesComment(
            seriesId,
            body.trim(),
            parentId,
            mediaPayload
          )
        : await postMovieComment(
            movieId!,
            body.trim(),
            parentId,
            mediaPayload
          );
      onPosted(result.comment);
      setBody("");
      setMedia(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  const textareaClass = compact
    ? "w-full rounded-lg border border-white/10 bg-finema-surface/40 px-3 py-2 text-sm text-finema-text placeholder:text-finema-muted focus:outline-none focus:border-finema-accent/50 resize-y"
    : "w-full rounded-lg border border-white/10 bg-finema-surface/40 px-4 py-3 text-finema-text placeholder:text-finema-muted focus:outline-none focus:border-finema-accent/50 resize-y";

  return (
    <>
      <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-3"}>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={2000}
          autoFocus={compact}
          className={textareaClass}
        />

        {media && (
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.type === "gif" ? media.previewUrl : media.url}
              alt={media.type === "sticker" ? media.label : "Selected GIF"}
              className={
                media.type === "sticker"
                  ? "h-16 w-16 object-contain"
                  : "max-h-24 rounded"
              }
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-finema-muted">
                {media.type === "gif" ? "GIF attached" : media.label}
              </p>
              <button
                type="button"
                onClick={() => setMedia(null)}
                className="mt-1 text-xs text-finema-muted hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGifPickerOpen(true)}
              className="rounded border border-white/10 px-2.5 py-1 text-xs text-finema-muted hover:border-finema-accent/50 hover:text-finema-text transition-colors"
            >
              GIF
            </button>
            <button
              type="button"
              onClick={() => setStickerPickerOpen(true)}
              className="rounded border border-white/10 px-2.5 py-1 text-xs text-finema-muted hover:border-finema-accent/50 hover:text-finema-text transition-colors"
            >
              Sticker
            </button>
            <span className="text-xs text-finema-muted">{body.length}/2000</span>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-sm rounded text-finema-muted hover:text-finema-text transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className={
                compact
                  ? "px-3 py-1.5 text-sm rounded bg-finema-accent text-white font-medium hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  : "px-5 py-2 rounded bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              }
            >
              {posting ? "Posting..." : submitLabel}
            </button>
          </div>
        </div>
      </form>

      <GifPicker
        open={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onSelect={setMedia}
      />
      <StickerPicker
        open={stickerPickerOpen}
        onClose={() => setStickerPickerOpen(false)}
        onSelect={setMedia}
      />
    </>
  );
}
