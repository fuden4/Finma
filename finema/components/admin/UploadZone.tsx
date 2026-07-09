"use client";

import { useCallback, useState } from "react";

interface UploadZoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  label?: string;
  hint?: string;
}

export function UploadZone({
  value,
  onChange,
  required = false,
  label = "Video file (MP4)",
  hint = "Drag and drop an MP4 file here, or click to browse",
}: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.includes("video") && !file.name.toLowerCase().endsWith(".mp4")) {
        return;
      }
      onChange(file);
    },
    [onChange]
  );

  return (
    <div>
      <label className="block text-sm font-medium text-finema-text mb-2">
        {label}
        {required && <span className="text-finema-accent ml-1">*</span>}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-finema-accent bg-finema-accent/10"
            : "border-white/20 hover:border-white/40"
        }`}
      >
        <input
          type="file"
          accept="video/mp4,.mp4"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {value ? (
          <div>
            <p className="text-finema-text font-medium">{value.name}</p>
            <p className="text-sm text-finema-muted mt-1">
              {(value.size / (1024 * 1024)).toFixed(1)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="mt-3 text-sm text-finema-accent hover:underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div>
            <p className="text-finema-text">{hint}</p>
            <p className="text-sm text-finema-muted mt-2">MP4 only</p>
          </div>
        )}
      </div>
    </div>
  );
}
