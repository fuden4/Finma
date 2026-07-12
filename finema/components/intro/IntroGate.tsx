"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { hasSeenIntro } from "@/lib/intro";
import { FirstVisitIntro } from "./FirstVisitIntro";

type IntroPhase = "checking" | "intro" | "app";

interface IntroGateProps {
  children: ReactNode;
}

export function IntroGate({ children }: IntroGateProps) {
  const [phase, setPhase] = useState<IntroPhase>("checking");

  useEffect(() => {
    setPhase(hasSeenIntro() ? "app" : "intro");
  }, []);

  if (phase === "checking") {
    return <div className="fixed inset-0 z-[100] bg-black" aria-hidden />;
  }

  if (phase === "intro") {
    return <FirstVisitIntro onComplete={() => setPhase("app")} />;
  }

  return children;
}
