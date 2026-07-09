"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

  const handleSelectMovie = useCallback(
    async (movieId: string) => {
      try {
        await recordSearchSelection(movieId);
      } catch {
        // Guests or failed requests should not block navigation.
      }
      setOpen(false);
      router.push(`/movies/${movieId}`);
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
    <SearchModal
      open={open}
      onClose={handleClose}
      onSelectMovie={handleSelectMovie}
    />
  );
}
