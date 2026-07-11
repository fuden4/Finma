"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { useEffect, useState } from "react";
import type { PublicUser } from "@/db/types";
import { openSearchModal } from "@/lib/search-events";
import { UserAvatar } from "@/components/profile/UserAvatar";

interface NavbarProps {
  user: PublicUser | null;
  onAuthChange?: () => void;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export function Navbar({ user }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleSearch() {
    closeMenu();
    openSearchModal();
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-finema-bg/95 backdrop-blur-md border-b border-white/10"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <nav className="flex items-center justify-between gap-2 px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 md:py-4 max-w-[1920px] mx-auto">
          <div className="flex min-w-0 items-center gap-4 md:gap-8">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold tracking-tight shrink-0"
            >
              <span className="text-finema-accent">F</span>
              <span className="text-finema-text">inema</span>
            </Link>
            <Link
              href="/"
              className="hidden md:block text-sm text-finema-muted hover:text-finema-text transition-colors"
            >
              Browse
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 p-2.5 sm:px-3 sm:py-1.5 text-finema-muted hover:text-finema-text hover:border-white/30 transition-colors touch-manipulation"
              aria-label="Search movies"
            >
              <SearchIcon className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline text-sm">Search</span>
              <span className="hidden md:inline text-xs opacity-70">(/)</span>
            </button>

            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 hover:border-white/30 transition-colors touch-manipulation"
                aria-label="Go to account"
              >
                <UserAvatar
                  displayName={user.display_name}
                  email={user.email}
                  avatarUrl={user.avatar_url}
                  size="sm"
                />
                <span className="hidden sm:block max-w-[120px] truncate text-sm text-finema-muted md:max-w-[180px]">
                  {user.display_name ?? user.email}
                </span>
              </Link>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/signup"
                    className="text-sm px-3 md:px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 transition-colors touch-manipulation"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm px-3 md:px-4 py-2 rounded-lg border border-finema-accent text-finema-accent hover:bg-finema-accent hover:text-white transition-colors touch-manipulation"
                  >
                    Sign In
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="inline-flex sm:hidden items-center justify-center rounded-lg border border-white/10 p-2.5 text-finema-text hover:border-white/30 transition-colors touch-manipulation"
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                >
                  <MenuIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && !user && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/70 sm:hidden"
              aria-label="Close menu"
              onClick={closeMenu}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 right-0 bottom-0 z-[70] flex w-[min(100%,300px)] flex-col border-l border-white/10 bg-finema-bg shadow-2xl sm:hidden pt-[env(safe-area-inset-top)]"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                <span className="text-lg font-semibold text-finema-text">Menu</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="rounded-lg p-2 text-finema-muted hover:text-finema-text touch-manipulation"
                  aria-label="Close menu"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 p-4">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="rounded-lg px-4 py-3 text-base text-finema-text hover:bg-white/5 transition-colors touch-manipulation"
                >
                  Browse
                </Link>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-lg px-4 py-3 text-left text-base text-finema-text hover:bg-white/5 transition-colors touch-manipulation"
                >
                  Search
                </button>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="mt-2 rounded-lg border border-finema-accent px-4 py-3 text-center text-base font-semibold text-finema-accent hover:bg-finema-accent hover:text-white transition-colors touch-manipulation"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="rounded-lg border border-white/20 px-4 py-3 text-center text-base font-semibold text-finema-text hover:border-white/40 transition-colors touch-manipulation"
                >
                  Sign Up
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
