"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SearchResultItem } from "@/db/types";
import { recordSearchSelection } from "@/lib/api-client";
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
      router.push(
        item.type === "series" ? `/series/${item.id}` : `/movies/${item.id}`
      );
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
