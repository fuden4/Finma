"use client";

import { useEffect, useRef, useState } from "react";

interface CommentMenuProps {
  onDelete: () => void;
}

export function CommentMenu({ onDelete }: CommentMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleDelete() {
    setOpen(false);
    onDelete();
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Comment options"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="rounded p-1 text-finema-muted hover:bg-white/10 hover:text-finema-text transition-colors disabled:opacity-50"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-white/10 bg-finema-surface py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
