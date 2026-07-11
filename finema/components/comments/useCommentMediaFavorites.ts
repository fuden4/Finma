"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommentMediaType } from "@/db/types";
import {
  addCommentMediaFavorite,
  getCommentMediaLibrary,
  removeCommentMediaFavorite,
} from "@/lib/api-client";

export function useCommentMediaFavorites(enabled: boolean) {
  const [favoriteUrls, setFavoriteUrls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setFavoriteUrls(new Set());
      return;
    }

    setLoading(true);
    try {
      const { library } = await getCommentMediaLibrary();
      setFavoriteUrls(
        new Set([
          ...library.gifFavorites.map((item) => item.media_url),
          ...library.stickerFavorites.map((item) => item.media_url),
        ])
      );
    } catch {
      setFavoriteUrls(new Set());
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(
    async (item: {
      mediaType: CommentMediaType;
      mediaUrl: string;
      previewUrl?: string;
      giphyId?: string | null;
      label?: string | null;
    }) => {
      const isFavorite = favoriteUrls.has(item.mediaUrl);

      if (isFavorite) {
        await removeCommentMediaFavorite({
          media_type: item.mediaType,
          media_url: item.mediaUrl,
        });
        setFavoriteUrls((prev) => {
          const next = new Set(prev);
          next.delete(item.mediaUrl);
          return next;
        });
      } else {
        await addCommentMediaFavorite({
          media_type: item.mediaType,
          media_url: item.mediaUrl,
          preview_url: item.previewUrl ?? item.mediaUrl,
          giphy_id: item.giphyId ?? null,
          label: item.label ?? null,
        });
        setFavoriteUrls((prev) => new Set(prev).add(item.mediaUrl));
      }
    },
    [favoriteUrls]
  );

  return { favoriteUrls, loading, refresh, toggleFavorite };
}
