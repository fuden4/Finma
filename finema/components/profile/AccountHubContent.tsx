"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { PublicUser } from "@/db/types";
import { logout } from "@/lib/api-client";
import { isRegularUser } from "@/lib/user-utils";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Navbar } from "@/components/layout/Navbar";

interface AccountHubContentProps {
  user: PublicUser;
}

interface AccountOption {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent?: boolean;
}

function StarIcon() {
  return (
    <svg className="h-6 w-6 text-finema-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-6 w-6 text-finema-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-6 w-6 text-finema-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="h-6 w-6 text-finema-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function PosterIcon() {
  return (
    <svg className="h-6 w-6 text-finema-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-6 w-6 text-finema-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg className="h-6 w-6 text-finema-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function getAccountOptions(user: PublicUser): AccountOption[] {
  const options: AccountOption[] = [];

  if (user.role === "admin") {
    options.push({
      title: "Admin Panel",
      description: "Manage movies, reports, and site content",
      href: "/admin",
      icon: <AdminIcon />,
      accent: true,
    });
  }

  if (isRegularUser(user)) {
    options.push(
      {
        title: "My Ratings",
        description: "Movies and shows you've rated",
        href: "/ratings",
        icon: <StarIcon />,
      },
      {
        title: "My List",
        description: "Your saved watchlist",
        href: "/watchlist",
        icon: <ListIcon />,
      },
      {
        title: "Watch History",
        description: "Recently watched titles",
        href: "/watch-history",
        icon: <HistoryIcon />,
      },
      {
        title: "My Comments",
        description: "Comments you've posted",
        href: "/comments",
        icon: <CommentIcon />,
      },
      {
        title: "Liked Posters",
        description: "Posters you've liked",
        href: "/posters/likes",
        icon: <PosterIcon />,
      },
      {
        title: "Liked Songs",
        description: "Music you've liked",
        href: "/songs/likes",
        icon: <StarIcon />,
      },
      {
        title: "My Playlists",
        description: "Your music playlists",
        href: "/songs/playlists",
        icon: <ListIcon />,
      },
    );
  }

  options.push({
    title: "Profile",
    description: "Edit name, photo, and account info",
    href: "/profile/settings",
    icon: <ProfileIcon />,
  });

  return options;
}

export function AccountHubContent({ user }: AccountHubContentProps) {
  const router = useRouter();
  const options = getAccountOptions(user);

  async function handleLogout() {
    await logout();
    router.refresh();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-finema-bg flex flex-col">
      <Navbar user={user} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col pt-24 px-4 md:px-8 pb-16 max-w-3xl mx-auto w-full"
      >
        <div className="flex items-center gap-4 mb-8">
          <UserAvatar
            displayName={user.display_name}
            email={user.email}
            avatarUrl={user.avatar_url}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-finema-text">
              {user.display_name ?? "Account"}
            </h1>
            <p className="text-sm text-finema-muted">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {options.map((option, index) => (
            <motion.div
              key={option.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={option.href}
                className={`flex aspect-square flex-col justify-between rounded-xl border border-white/10 bg-finema-surface/40 p-4 transition-colors hover:border-white/20 hover:bg-finema-surface/60 ${
                  option.accent ? "border-finema-accent/30" : ""
                }`}
              >
                <div>{option.icon}</div>
                <div>
                  <p className={`font-semibold ${option.accent ? "text-finema-accent" : "text-finema-text"}`}>
                    {option.title}
                  </p>
                  <p className="mt-1 text-sm text-finema-muted line-clamp-2">
                    {option.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full rounded-xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
          >
            Sign Out
          </button>
        </div>
      </motion.main>
    </div>
  );
}
