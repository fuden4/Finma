import type { CommentMediaType } from "@/db/types";

interface CommentMediaProps {
  mediaType: CommentMediaType;
  mediaUrl: string;
  className?: string;
  canFavorite?: boolean;
  isFavorite?: boolean;
  favoritePending?: boolean;
  onToggleFavorite?: () => void;
}

export function CommentMedia({
  mediaType,
  mediaUrl,
  className = "",
  canFavorite = false,
  isFavorite = false,
  favoritePending = false,
  onToggleFavorite,
}: CommentMediaProps) {
  const alt = mediaType === "gif" ? "GIF attachment" : "Sticker attachment";
  const sizeClass =
    mediaType === "sticker" ? "h-24 w-24 object-contain" : "max-h-48 rounded-lg";

  return (
    <div className={`relative mt-2 inline-block max-w-full ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaUrl}
        alt={alt}
        className={`${sizeClass} ${mediaType === "gif" ? "max-w-full" : ""}`}
        loading="lazy"
      />
      {canFavorite && onToggleFavorite && (
        <button
          type="button"
          disabled={favoritePending}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={onToggleFavorite}
          className={`absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
            isFavorite
              ? "text-yellow-300"
              : "text-finema-muted hover:text-yellow-300"
          }`}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      )}
    </div>
  );
}
