"use client";

import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import type { PublicUser } from "@/db/types";
import { openSearchModal } from "@/lib/search-events";
import { UserAvatar } from "@/components/profile/UserAvatar";

interface NavbarProps {
  user: PublicUser | null;
  onAuthChange?: () => void;
}

export function Navbar({ user }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

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
            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 py-1.5 rounded border border-white/10 hover:border-white/30 transition-colors"
              aria-label="Go to account"
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
            </Link>
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
