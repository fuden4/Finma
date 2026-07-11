"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CommentMediaLibraryItem, UserUploadedSticker } from "@/db/types";
import {
  addCommentMediaFavorite,
  getCommentMediaLibrary,
  removeCommentMediaFavorite,
  uploadSticker,
} from "@/lib/api-client";
import { STICKER_PACKS } from "@/lib/sticker-packs";
import {
  libraryItemToPickerItem,
  MediaPickerGrid,
  type MediaPickerItem,
  PickerModalShell,
  PickerTabBar,
} from "@/components/comments/MediaPickerGrid";

export interface SelectedSticker {
  type: "sticker";
  url: string;
  label: string;
}

interface StickerPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (sticker: SelectedSticker) => void;
}

type StickerTab = "recent" | "favorites" | "uploads" | "packs";

function toSelectedSticker(item: MediaPickerItem): SelectedSticker {
  return {
    type: "sticker",
    url: item.url,
    label: item.label ?? "Sticker",
  };
}

function uploadedStickerToPickerItem(
  sticker: UserUploadedSticker,
  isFavorite: boolean
): MediaPickerItem {
  return {
    id: sticker.id,
    previewUrl: sticker.url,
    url: sticker.url,
    label: sticker.label,
    isFavorite,
  };
}

export function StickerPicker({ open, onClose, onSelect }: StickerPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<StickerTab>("recent");
  const [activePackId, setActivePackId] = useState(STICKER_PACKS[0]?.id ?? "");
  const [recent, setRecent] = useState<CommentMediaLibraryItem[]>([]);
  const [favorites, setFavorites] = useState<CommentMediaLibraryItem[]>([]);
  const [uploadedStickers, setUploadedStickers] = useState<UserUploadedSticker[]>([]);
  const [favoriteUrls, setFavoriteUrls] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    try {
      const { library } = await getCommentMediaLibrary();
      setRecent(library.stickerRecent);
      setFavorites(library.stickerFavorites);
      setUploadedStickers(library.uploadedStickers);
      setFavoriteUrls(
        new Set(library.stickerFavorites.map((item) => item.media_url))
      );
    } catch {
      setRecent([]);
      setFavorites([]);
      setUploadedStickers([]);
      setFavoriteUrls(new Set());
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadLibrary();
    setActiveTab("recent");
    setActivePackId(STICKER_PACKS[0]?.id ?? "");
    setError(null);
  }, [open, loadLibrary]);

  const recentItems = useMemo(
    () =>
      recent.map((item) =>
        libraryItemToPickerItem(item, favoriteUrls.has(item.media_url))
      ),
    [recent, favoriteUrls]
  );

  const favoriteItems = useMemo(
    () => favorites.map((item) => libraryItemToPickerItem(item, true)),
    [favorites]
  );

  const uploadedItems = useMemo(
    () =>
      uploadedStickers.map((sticker) =>
        uploadedStickerToPickerItem(
          sticker,
          favoriteUrls.has(sticker.url)
        )
      ),
    [uploadedStickers, favoriteUrls]
  );

  const packItems = useMemo(() => {
    const pack =
      STICKER_PACKS.find((entry) => entry.id === activePackId) ??
      STICKER_PACKS[0];
    return (
      pack?.stickers.map((sticker) => ({
        id: sticker.id,
        previewUrl: sticker.url,
        url: sticker.url,
        label: sticker.label,
        isFavorite: favoriteUrls.has(sticker.url),
      })) ?? []
    );
  }, [activePackId, favoriteUrls]);

  async function handleToggleFavorite(item: MediaPickerItem) {
    const isFavorite = favoriteUrls.has(item.url);

    try {
      if (isFavorite) {
        await removeCommentMediaFavorite({
          media_type: "sticker",
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
          media_type: "sticker",
          media_url: item.url,
          preview_url: item.previewUrl,
          label: item.label ?? null,
        });
        setFavoriteUrls((prev) => new Set(prev).add(item.url));
        setFavorites((prev) => [
          favorite,
          ...prev.filter((fav) => fav.media_url !== item.url),
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update favorite");
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { sticker } = await uploadSticker(file);
      setUploadedStickers((prev) => [sticker, ...prev]);
      setActiveTab("uploads");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload sticker");
    } finally {
      setUploading(false);
    }
  }

  function handleSelect(item: MediaPickerItem) {
    onSelect(toSelectedSticker(item));
    onClose();
  }

  const tabs = [
    { id: "recent", label: "Recent" },
    { id: "favorites", label: "Favorites" },
    { id: "uploads", label: "My uploads" },
    { id: "packs", label: "Packs" },
  ] as const;

  return (
    <PickerModalShell
      open={open}
      title="Choose a sticker"
      onClose={onClose}
      maxWidthClass="max-w-md"
    >
      <PickerTabBar
        tabs={[...tabs]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as StickerTab)}
      />

      <div className="mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => void handleUpload(event)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-white/20 px-3 py-2 text-sm text-finema-muted hover:border-finema-accent/50 hover:text-finema-text transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload sticker from PC"}
        </button>
      </div>

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
          emptyMessage="No recent stickers yet."
          variant="sticker"
        />
      )}

      {activeTab === "favorites" && (
        <MediaPickerGrid
          items={favoriteItems}
          onSelect={handleSelect}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="No favorite stickers yet. Star a sticker to save it here."
          variant="sticker"
        />
      )}

      {activeTab === "uploads" && (
        <MediaPickerGrid
          items={uploadedItems}
          onSelect={handleSelect}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="No uploaded stickers yet. Use the button above to add one."
          variant="sticker"
        />
      )}

      {activeTab === "packs" && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {STICKER_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setActivePackId(pack.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activePackId === pack.id
                    ? "bg-finema-accent/80 text-white"
                    : "border border-white/10 text-finema-muted hover:text-finema-text"
                }`}
              >
                {pack.name}
              </button>
            ))}
          </div>
          <MediaPickerGrid
            items={packItems}
            onSelect={handleSelect}
            onToggleFavorite={handleToggleFavorite}
            emptyMessage="No stickers in this pack."
            variant="sticker"
          />
        </>
      )}
    </PickerModalShell>
  );
}
