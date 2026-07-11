"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SearchResultItem } from "@/db/types";
import { recordSearchSelection } from "@/lib/api-client";
import { moviePath, songPath } from "@/lib/content-paths";
import { OPEN_SEARCH_EVENT } from "@/lib/search-events";
import { isTextInput, SearchModal } from "@/components/search/SearchModal";

export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback(
    async (item: SearchResultItem) => {
      if (item.type === "movie") {
        try {
          await recordSearchSelection(item.id);
        } catch {
          // Guests or failed requests should not block navigation.
        }
      }

      setOpen(false);
      if (item.type === "series") {
        router.push(`/series/${item.id}`);
      } else if (item.type === "song") {
        router.push(songPath(item));
      } else if (item.type === "poster") {
        router.push(`/posters?open=${item.id}`);
      } else {
        router.push(moviePath(item));
      }
    },
    [router]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || open) return;
      if (pathname.startsWith("/watch")) return;
      if (isTextInput(event.target)) return;

      event.preventDefault();
      setOpen(true);
    }

    function handleOpenSearch() {
      setOpen(true);
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
    };
  }, [open, pathname]);

  return (
    <SearchModal open={open} onClose={handleClose} onSelect={handleSelect} />
  );
}
