"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommentMediaLibraryItem } from "@/db/types";
import {
  addCommentMediaFavorite,
  getCommentMediaLibrary,
  removeCommentMediaFavorite,
  searchGifs,
} from "@/lib/api-client";
import {
  libraryItemToPickerItem,
  MediaPickerGrid,
  type MediaPickerItem,
  PickerModalShell,
  PickerTabBar,
} from "@/components/comments/MediaPickerGrid";

export interface SelectedGif {
  type: "gif";
  url: string;
  previewUrl: string;
  giphyId?: string;
}

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (gif: SelectedGif) => void;
}

type GifTab = "recent" | "favorites" | "search";

function toSelectedGif(item: MediaPickerItem): SelectedGif {
  return {
    type: "gif",
    url: item.url,
    previewUrl: item.previewUrl,
    giphyId: item.giphyId ?? undefined,
  };
}

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [activeTab, setActiveTab] = useState<GifTab>("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaPickerItem[]>([]);
  const [recent, setRecent] = useState<CommentMediaLibraryItem[]>([]);
  const [favorites, setFavorites] = useState<CommentMediaLibraryItem[]>([]);
  const [favoriteUrls, setFavoriteUrls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    try {
      const { library } = await getCommentMediaLibrary();
      setRecent(library.gifRecent);
      setFavorites(library.gifFavorites);
      setFavoriteUrls(new Set(library.gifFavorites.map((item) => item.media_url)));
      setActiveTab(library.gifFavorites.length > 0 ? "recent" : "search");
    } catch {
      setRecent([]);
      setFavorites([]);
      setFavoriteUrls(new Set());
      setActiveTab("search");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadLibrary();
    setQuery("");
    setSearchResults([]);
    setError(null);
  }, [open, loadLibrary]);

  useEffect(() => {
    if (!open || activeTab !== "search") return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void searchGifs(query)
        .then((result) => {
          if (cancelled) return;
          setSearchResults(
            result.gifs.map((gif) => ({
              id: gif.id,
              previewUrl: gif.previewUrl,
              url: gif.url,
              giphyId: gif.id,
              isFavorite: favoriteUrls.has(gif.url),
            }))
          );
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to load GIFs");
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, activeTab, query, favoriteUrls]);

  const recentItems = useMemo(
    () =>
      recent.map((item) =>
        libraryItemToPickerItem(item, favoriteUrls.has(item.media_url))
      ),
    [recent, favoriteUrls]
  );

  const favoriteItems = useMemo(
    () =>
      favorites.map((item) =>
        libraryItemToPickerItem(item, true)
      ),
    [favorites]
  );

  async function handleToggleFavorite(item: MediaPickerItem) {
    const isFavorite = favoriteUrls.has(item.url);

    try {
      if (isFavorite) {
        await removeCommentMediaFavorite({
          media_type: "gif",
          media_url: item.url,
        });
        setFavoriteUrls((prev) => {
          const next = new Set(prev);
          next.delete(item.url);
          return next;
        });
        setFavorites((prev) => prev.filter((fav) => fav.media_url !== item.url));
      } else {
        const { favorite } = await addCommentMediaFavorite({
          media_type: "gif",
          media_url: item.url,
          preview_url: item.previewUrl,
          giphy_id: item.giphyId ?? null,
        });
        setFavoriteUrls((prev) => new Set(prev).add(item.url));
        setFavorites((prev) => [favorite, ...prev.filter((fav) => fav.media_url !== item.url)]);
      }

      if (activeTab === "search") {
        setSearchResults((prev) =>
          prev.map((gif) =>
            gif.url === item.url ? { ...gif, isFavorite: !isFavorite } : gif
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update favorite");
    }
  }

  function handleSelect(item: MediaPickerItem) {
    onSelect(toSelectedGif(item));
    onClose();
  }

  const tabs = [
    { id: "recent", label: "Recent" },
    { id: "favorites", label: "Favorites" },
    { id: "search", label: "Search" },
  ] as const;

  return (
    <PickerModalShell open={open} title="Choose a GIF" onClose={onClose}>
      <PickerTabBar
        tabs={[...tabs]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as GifTab)}
      />

      {activeTab === "search" && (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Giphy..."
          className="mb-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-finema-text placeholder:text-finema-muted focus:outline-none focus:border-finema-accent/50"
        />
      )}

      {error && (
        <p className="mb-3 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {activeTab === "recent" && (
        <MediaPickerGrid
          items={recentItems}
          onSelect={handleSelect}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="No recent GIFs yet."
          variant="gif"
        />
      )}

      {activeTab === "favorites" && (
        <MediaPickerGrid
          items={favoriteItems}
          onSelect={handleSelect}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="No favorite GIFs yet. Star a GIF to save it here."
          variant="gif"
        />
      )}

      {activeTab === "search" &&
        (loading ? (
          <p className="py-8 text-center text-sm text-finema-muted">
            Loading GIFs...
          </p>
        ) : (
          <MediaPickerGrid
            items={searchResults}
            onSelect={handleSelect}
            onToggleFavorite={handleToggleFavorite}
            emptyMessage="No GIFs found."
            variant="gif"
          />
        ))}
    </PickerModalShell>
  );
}
