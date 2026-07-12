"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./SiteFooter";

const SONGS_SUBROUTES = new Set(["likes", "playlists", "blocks", "categories"]);

function isSongPlayerPage(pathname: string): boolean {
  const match = pathname.match(/^\/songs\/([^/]+)\/?$/);
  if (!match) return false;
  return !SONGS_SUBROUTES.has(match[1]);
}

export function SiteFooterGate() {
  const pathname = usePathname();
  if (isSongPlayerPage(pathname)) return null;
  return <SiteFooter />;
}
