"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface ImagePickerValue {
  url: string;
  file: File | null;
}

interface ImagePickerProps {
  label: string;
  value: ImagePickerValue;
  onChange: (next: ImagePickerValue) => void;
  aspect?: "poster" | "backdrop";
  hint?: string;
}

type Mode = "url" | "upload";

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function ImagePicker({
  label,
  value,
  onChange,
  aspect = "poster",
  hint,
}: ImagePickerProps) {
  const [mode, setMode] = useState<Mode>(value.file ? "upload" : "url");
  const [dragging, setDragging] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value.file) {
      setObjectUrl(null);
      return;
    }
    const next = URL.createObjectURL(value.file);
    setObjectUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [value.file]);

  const previewSrc = objectUrl ?? (value.url.trim() ? value.url.trim() : null);

  const setFile = useCallback(
    (file: File) => {
      onChange({ url: "", file });
      setMode("upload");
    },
    [onChange]
  );

  const setUrl = useCallback(
    (url: string) => {
      onChange({ url, file: null });
    },
    [onChange]
  );

  const clear = useCallback(() => {
    onChange({ url: "", file: null });
  }, [onChange]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              setFile(file);
              return;
            }
          }
        }
      }
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && /^https?:\/\//i.test(text)) {
        e.preventDefault();
        setMode("url");
        setUrl(text);
      }
    },
    [setFile, setUrl]
  );

  const aspectClass = useMemo(
    () => (aspect === "backdrop" ? "aspect-video" : "aspect-[2/3]"),
    [aspect]
  );

  return (
    <div onPaste={handlePaste}>
      <label className="block text-sm font-medium mb-2">{label}</label>

      <div className="mb-2 inline-flex rounded-lg border border-white/10 bg-finema-surface p-0.5 text-xs">
        {(["url", "upload"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              mode === m
                ? "bg-finema-accent text-white"
                : "text-finema-muted hover:text-finema-text"
            }`}
          >
            {m === "url" ? "URL" : "Upload"}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div
          className={`relative ${aspectClass} w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-finema-surface`}
        >
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt="preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-finema-muted">
              No image
            </div>
          )}
        </div>

        <div className="flex-1">
          {mode === "url" ? (
            <input
              type="url"
              value={value.file ? "" : value.url}
              placeholder="https://…  (or paste an image / URL)"
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg bg-finema-surface border border-white/10 px-4 py-2.5 focus:border-finema-accent focus:outline-none"
            />
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file && isImageFile(file)) setFile(file);
              }}
              className={`relative rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors ${
                dragging
                  ? "border-finema-accent bg-finema-accent/10"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && isImageFile(file)) setFile(file);
                }}
              />
              {value.file ? (
                <span className="text-finema-text">{value.file.name}</span>
              ) : (
                <span className="text-finema-muted">
                  Drag & drop, click, or paste an image
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-finema-muted">
            {hint && <span>{hint}</span>}
            {previewSrc && (
              <button
                type="button"
                onClick={clear}
                className="text-finema-accent hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
