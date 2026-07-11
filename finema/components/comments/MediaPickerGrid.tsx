"use client";

export interface MediaPickerItem {
  id: string;
  previewUrl: string;
  url: string;
  label?: string;
  giphyId?: string | null;
  isFavorite?: boolean;
}

interface MediaPickerGridProps {
  items: MediaPickerItem[];
  onSelect: (item: MediaPickerItem) => void;
  onToggleFavorite?: (item: MediaPickerItem) => void;
  emptyMessage: string;
  variant?: "gif" | "sticker";
}

export function MediaPickerGrid({
  items,
  onSelect,
  onToggleFavorite,
  emptyMessage,
  variant = "gif",
}: MediaPickerGridProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-finema-muted">{emptyMessage}</p>
    );
  }

  const gridClass =
    variant === "sticker"
      ? "grid max-h-72 grid-cols-4 gap-2 overflow-y-auto"
      : "grid max-h-72 grid-cols-3 gap-2 overflow-y-auto";

  const imageClass =
    variant === "sticker"
      ? "h-14 w-14 object-contain"
      : "h-24 w-full object-cover";

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <div key={item.id} className="relative">
          <button
            type="button"
            title={item.label}
            onClick={() => onSelect(item)}
            className={
              variant === "sticker"
                ? "flex w-full items-center justify-center rounded-lg border border-white/10 bg-black/20 p-2 hover:border-finema-accent/50 transition-colors"
                : "w-full overflow-hidden rounded-lg border border-white/10 bg-black/20 hover:border-finema-accent/50 transition-colors"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt={item.label ?? ""}
              className={imageClass}
              loading="lazy"
            />
          </button>
          {onToggleFavorite && (
            <button
              type="button"
              aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(item);
              }}
              className={`absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-xs transition-colors ${
                item.isFavorite
                  ? "text-yellow-300"
                  : "text-finema-muted hover:text-yellow-300"
              }`}
            >
              {item.isFavorite ? "★" : "☆"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

interface PickerTabBarProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function PickerTabBar({ tabs, activeTab, onChange }: PickerTabBarProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-finema-accent text-white"
              : "border border-white/10 text-finema-muted hover:text-finema-text"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface PickerModalShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function PickerModalShell({
  open,
  title,
  onClose,
  children,
  maxWidthClass = "max-w-lg",
}: PickerModalShellProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidthClass} rounded-xl border border-white/10 bg-finema-surface p-4 shadow-xl`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-finema-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-finema-muted hover:text-finema-text transition-colors"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function libraryItemToPickerItem(
  item: {
    media_url: string;
    preview_url: string | null;
    giphy_id: string | null;
    label: string | null;
  },
  isFavorite: boolean
): MediaPickerItem {
  return {
    id: item.giphy_id ?? item.media_url,
    previewUrl: item.preview_url ?? item.media_url,
    url: item.media_url,
    label: item.label ?? undefined,
    giphyId: item.giphy_id,
    isFavorite,
  };
}
