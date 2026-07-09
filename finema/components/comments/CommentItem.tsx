"use client";

import { useState } from "react";
import type { MovieComment, PublicUser } from "@/db/types";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { StarRatingDisplay } from "@/components/ratings/StarRatingDisplay";
import { ReplyForm } from "@/components/comments/ReplyForm";
import { ReplyList } from "@/components/comments/ReplyList";

interface CommentItemProps {
  comment: MovieComment;
  movieId: string;
  user: PublicUser | null;
  currentUserRating?: number | null;
  canInteract: boolean;
  isReply?: boolean;
  parentDisplayName?: string;
  onReplyPosted: (parentId: string, reply: MovieComment) => void;
  onReport: (commentId: string) => void;
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
}: {
  comment: MovieComment;
  user: PublicUser | null;
  currentUserRating?: number | null;
  canInteract: boolean;
  isReply: boolean;
  parentDisplayName?: string;
  showReplyForm: boolean;
  onToggleReplyForm: () => void;
  onReplyPosted: (parentId: string, reply: MovieComment) => void;
  onReport: (commentId: string) => void;
  movieId: string;
}) {
  const displayRating =
    user?.id === comment.user_id
      ? (currentUserRating ?? comment.user_rating)
      : comment.user_rating;

  const isOwnComment = user?.id === comment.user_id;

  return (
    <div className="flex items-start gap-3">
      <UserAvatar
        displayName={comment.display_name}
        email=""
        avatarUrl={comment.avatar_url}
        size="sm"
      />
      <div className="min-w-0 flex-1">
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
        <div className="flex flex-wrap items-center gap-2 mb-1">
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
        <p className="text-finema-muted leading-relaxed whitespace-pre-wrap">
          {comment.body}
        </p>

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
  user,
  currentUserRating,
  canInteract,
  isReply = false,
  parentDisplayName,
  onReplyPosted,
  onReport,
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
          />
        </div>

        {hasReplies && (
          <div className="border-t border-white/10 bg-black/20 px-4 pb-1">
            <ReplyList
              replies={comment.replies!}
              parentDisplayName={comment.display_name ?? "Anonymous"}
              movieId={movieId}
              user={user}
              currentUserRating={currentUserRating}
              canInteract={canInteract}
              onReplyPosted={onReplyPosted}
              onReport={onReport}
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
      />
    </div>
  );
}
