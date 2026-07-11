"use client";

import type { ReactNode } from "react";
import { MusicPlayerProvider, useMusicPlayer } from "./MusicPlayerProvider";
import { MiniPlayerBar } from "./MiniPlayerBar";

function MusicPlayerLayout({ children }: { children: ReactNode }) {
  const { track, view } = useMusicPlayer();
  const showMiniBar = Boolean(track && view === "minimized");

  return (
    <div className={showMiniBar ? "pb-[4.25rem] sm:pb-[4.5rem]" : undefined}>
      {children}
    </div>
  );
}

export function MusicPlayerShell({ children }: { children: ReactNode }) {
  return (
    <MusicPlayerProvider>
      <MusicPlayerLayout>{children}</MusicPlayerLayout>
      <MiniPlayerBar />
    </MusicPlayerProvider>
  );
}
