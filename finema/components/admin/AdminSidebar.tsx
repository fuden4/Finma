"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/movies", label: "Movies", exact: false },
  { href: "/admin/reports", label: "Reports", exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-white/10 bg-finema-surface/50 p-4">
      <p className="text-xs uppercase tracking-widest text-finema-muted mb-4">
        Control Panel
      </p>
      <nav className="space-y-1">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-finema-accent text-white"
                  : "text-finema-muted hover:bg-finema-surface-hover hover:text-finema-text"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm text-finema-muted hover:bg-finema-surface-hover hover:text-finema-text transition-colors mt-4"
        >
          Back to Site
        </Link>
      </nav>
    </aside>
  );
}
