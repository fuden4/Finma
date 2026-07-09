"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { PublicUser } from "@/db/types";
import { logout } from "@/lib/api-client";
import { openSearchModal } from "@/lib/search-events";
import { isRegularUser } from "@/lib/user-utils";
import { UserAvatar } from "@/components/profile/UserAvatar";

interface NavbarProps {
  user: PublicUser | null;
  onAuthChange?: () => void;
}

export function Navbar({ user, onAuthChange }: NavbarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    onAuthChange?.();
    router.refresh();
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      const target = event.target;
      if (target instanceof Node && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-finema-bg/90 backdrop-blur-md border-b border-white/10"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-finema-accent">F</span>
            <span className="text-finema-text">inema</span>
          </Link>
          <span className="hidden sm:block text-sm text-finema-muted">Browse</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openSearchModal}
            className="text-sm px-3 py-1.5 rounded border border-white/10 text-finema-muted hover:text-finema-text hover:border-white/30 transition-colors"
            aria-label="Search movies"
          >
            Search <span className="hidden sm:inline text-xs opacity-70">(/)</span>
          </button>

          {user ? (
            <>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded border border-white/10 hover:border-white/30 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Open user menu"
                >
                  <UserAvatar
                    displayName={user.display_name}
                    email={user.email}
                    avatarUrl={user.avatar_url}
                    size="sm"
                  />
                  <span className="hidden sm:block text-sm text-finema-muted">
                    {user.display_name ?? user.email}
                  </span>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-52 rounded-lg border border-white/10 bg-finema-surface/95 backdrop-blur-md shadow-xl p-1.5 z-50 origin-top-right"
                    >
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded px-3 py-2 text-sm text-finema-accent hover:bg-white/5"
                        >
                          Admin Panel
                        </Link>
                      )}

                      {isRegularUser(user) && (
                        <>
                      <Link
                        href="/ratings"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded px-3 py-2 text-sm text-finema-muted hover:text-finema-text hover:bg-white/5"
                      >
                        My Ratings
                      </Link>
                      <Link
                        href="/watchlist"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded px-3 py-2 text-sm text-finema-muted hover:text-finema-text hover:bg-white/5"
                      >
                        My List
                      </Link>
                      <Link
                        href="/watch-history"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded px-3 py-2 text-sm text-finema-muted hover:text-finema-text hover:bg-white/5"
                      >
                        Watch History
                      </Link>
                      <Link
                        href="/comments"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded px-3 py-2 text-sm text-finema-muted hover:text-finema-text hover:bg-white/5"
                      >
                        My Comments
                      </Link>
                        </>
                      )}
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded px-3 py-2 text-sm text-finema-muted hover:text-finema-text hover:bg-white/5"
                      >
                        Profile
                      </Link>

                      <div className="my-1 h-px bg-white/10" />
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="w-full text-left rounded px-3 py-2 text-sm text-finema-muted hover:text-finema-text hover:bg-white/5"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/signup"
                className="text-sm px-4 py-2 rounded border border-white/20 hover:border-white/40 transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded border border-finema-accent text-finema-accent hover:bg-finema-accent hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
