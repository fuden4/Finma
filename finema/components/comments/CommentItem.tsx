"use client";

import { useState } from "react";
import type { CommentMediaType, MovieComment, PublicUser, SeriesComment } from "@/db/types";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";
import { ReplyForm } from "@/components/comments/ReplyForm";
import { ReplyList } from "@/components/comments/ReplyList";
import { CommentMedia } from "@/components/comments/CommentMedia";
import { CommentMenu } from "@/components/comments/CommentMenu";

interface CommentItemProps {
  comment: MovieComment;
  movieId?: string;
  seriesId?: string;
  user: PublicUser | null;
  currentUserRating?: number | null;
  canInteract: boolean;
  isReply?: boolean;
  parentDisplayName?: string;
  favoriteMediaUrls?: Set<string>;
  onToggleMediaFavorite?: (item: {
    mediaType: CommentMediaType;
    mediaUrl: string;
    previewUrl?: string;
    label?: string | null;
  }) => Promise<void>;
  onReplyPosted: (parentId: string, reply: MovieComment | SeriesComment) => void;
  onReport: (commentId: string) => void;
  onRequestDelete?: (commentId: string) => void;
}

function formatCommentDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function CommentBody({
  comment,
  user,
  currentUserRating,
  canInteract,
  isReply,
  parentDisplayName,
  showReplyForm,
  onToggleReplyForm,
  onReplyPosted,
  onReport,
  movieId,
  seriesId,
  favoriteMediaUrls,
  onToggleMediaFavorite,
  onRequestDelete,
}: {
  comment: MovieComment;
  user: PublicUser | null;
  currentUserRating?: number | null;
  canInteract: boolean;
  isReply: boolean;
  parentDisplayName?: string;
  showReplyForm: boolean;
  onToggleReplyForm: () => void;
  onReplyPosted: (parentId: string, reply: MovieComment | SeriesComment) => void;
  onReport: (commentId: string) => void;
  movieId?: string;
  seriesId?: string;
  favoriteMediaUrls?: Set<string>;
  onToggleMediaFavorite?: (item: {
    mediaType: CommentMediaType;
    mediaUrl: string;
    previewUrl?: string;
    label?: string | null;
  }) => Promise<void>;
  onRequestDelete?: (commentId: string) => void;
}) {
  const displayRating =
    user?.id === comment.user_id
      ? (currentUserRating ?? comment.user_rating)
      : comment.user_rating;

  const isOwnComment = user?.id === comment.user_id;
  const [favoritePending, setFavoritePending] = useState(false);

  async function handleToggleMediaFavorite() {
    if (
      !comment.media_type ||
      !comment.media_url ||
      !onToggleMediaFavorite ||
      favoritePending
    ) {
      return;
    }

    setFavoritePending(true);
    try {
      await onToggleMediaFavorite({
        mediaType: comment.media_type,
        mediaUrl: comment.media_url,
        previewUrl: comment.media_url,
        label: comment.media_type === "sticker" ? "Sticker" : null,
      });
    } finally {
      setFavoritePending(false);
    }
  }

  return (
    <div className="flex items-start gap-3">
      <UserAvatar
        displayName={comment.display_name}
        email=""
        avatarUrl={comment.avatar_url}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-medium text-finema-text">
              {comment.display_name ?? "Anonymous"}
            </span>
            {displayRating != null && (
              <StarRatingDisplay value={displayRating} size="sm" />
            )}
            <time
              dateTime={comment.created_at}
              className="text-xs text-finema-muted"
            >
              {formatCommentDate(comment.created_at)}
            </time>
          </div>
          {isOwnComment && canInteract && onRequestDelete && (
            <CommentMenu onDelete={() => onRequestDelete(comment.id)} />
          )}
        </div>
        {isReply && parentDisplayName && (
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-finema-muted">
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-finema-accent/70"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 8h7M7 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>
              Reply to{" "}
              <span className="font-medium text-finema-text/80">
                {parentDisplayName}
              </span>
            </span>
          </p>
        )}
        {comment.body.length > 0 && (
          <p className="text-finema-muted leading-relaxed whitespace-pre-wrap">
            {comment.body}
          </p>
        )}
        {comment.media_type && comment.media_url && (
          <CommentMedia
            mediaType={comment.media_type}
            mediaUrl={comment.media_url}
            canFavorite={canInteract && !!onToggleMediaFavorite}
            isFavorite={favoriteMediaUrls?.has(comment.media_url) ?? false}
            favoritePending={favoritePending}
            onToggleFavorite={() => void handleToggleMediaFavorite()}
          />
        )}

        {canInteract && (
          <div className="mt-2 flex items-center gap-3">
            {!isReply && (
              <button
                type="button"
                onClick={onToggleReplyForm}
                className="text-xs text-finema-muted hover:text-finema-accent transition-colors"
              >
                Reply
              </button>
            )}
            {!isOwnComment && (
              <button
                type="button"
                onClick={() => onReport(comment.id)}
                className="text-xs text-finema-muted hover:text-red-400 transition-colors"
              >
                Report
              </button>
            )}
          </div>
        )}

        {showReplyForm && !isReply && (
          <ReplyForm
            movieId={movieId}
            seriesId={seriesId}
            parentId={comment.id}
            onPosted={(reply) => {
              onReplyPosted(comment.id, reply);
            }}
            onCancel={onToggleReplyForm}
          />
        )}
      </div>
    </div>
  );
}

export function CommentItem({
  comment,
  movieId,
  seriesId,
  user,
  currentUserRating,
  canInteract,
  isReply = false,
  parentDisplayName,
  onReplyPosted,
  onReport,
  favoriteMediaUrls,
  onToggleMediaFavorite,
  onRequestDelete,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const hasReplies = !isReply && (comment.replies?.length ?? 0) > 0;
  const isThreaded = !isReply && (hasReplies || showReplyForm);

  function handleToggleReplyForm() {
    setShowReplyForm((prev) => !prev);
  }

  if (isReply) {
    return (
      <div className="relative border-l-2 border-finema-accent/40 pl-4 py-3">
        <CommentBody
          comment={comment}
          user={user}
          currentUserRating={currentUserRating}
          canInteract={canInteract}
          isReply
          parentDisplayName={parentDisplayName}
          showReplyForm={false}
          onToggleReplyForm={handleToggleReplyForm}
          onReplyPosted={onReplyPosted}
          onReport={onReport}
          movieId={movieId}
          seriesId={seriesId}
          favoriteMediaUrls={favoriteMediaUrls}
          onToggleMediaFavorite={onToggleMediaFavorite}
          onRequestDelete={onRequestDelete}
        />
      </div>
    );
  }

  if (isThreaded) {
    return (
      <div className="rounded-lg border border-white/10 bg-finema-surface/30 overflow-hidden">
        <div className="p-4">
          <CommentBody
            comment={comment}
            user={user}
            currentUserRating={currentUserRating}
            canInteract={canInteract}
            isReply={false}
            showReplyForm={showReplyForm}
            onToggleReplyForm={() => {
              handleToggleReplyForm();
            }}
            onReplyPosted={(parentId, reply) => {
              onReplyPosted(parentId, reply);
              setShowReplyForm(false);
            }}
            onReport={onReport}
            movieId={movieId}
            seriesId={seriesId}
            favoriteMediaUrls={favoriteMediaUrls}
            onToggleMediaFavorite={onToggleMediaFavorite}
            onRequestDelete={onRequestDelete}
          />
        </div>

        {hasReplies && (
          <div className="border-t border-white/10 bg-black/20 px-4 pb-1">
            <ReplyList
              replies={comment.replies!}
              parentDisplayName={comment.display_name ?? "Anonymous"}
              movieId={movieId}
              seriesId={seriesId}
              user={user}
              currentUserRating={currentUserRating}
              canInteract={canInteract}
              onReplyPosted={onReplyPosted}
              onReport={onReport}
              favoriteMediaUrls={favoriteMediaUrls}
              onToggleMediaFavorite={onToggleMediaFavorite}
              onRequestDelete={onRequestDelete}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-finema-surface/30 p-4">
      <CommentBody
        comment={comment}
        user={user}
        currentUserRating={currentUserRating}
        canInteract={canInteract}
        isReply={false}
        showReplyForm={showReplyForm}
        onToggleReplyForm={handleToggleReplyForm}
        onReplyPosted={(parentId, reply) => {
          onReplyPosted(parentId, reply);
          setShowReplyForm(false);
        }}
        onReport={onReport}
        movieId={movieId}
        seriesId={seriesId}
        favoriteMediaUrls={favoriteMediaUrls}
        onToggleMediaFavorite={onToggleMediaFavorite}
        onRequestDelete={onRequestDelete}
      />
    </div>
  );
}
