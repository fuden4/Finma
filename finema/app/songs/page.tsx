import type { Metadata } from "next";
import { SongsContent } from "@/components/songs/SongsContent";

export const metadata: Metadata = {
  title: "Songs | Finema",
  description: "Browse and discover music on Finema.",
};

export default function SongsPage() {
  return <SongsContent />;
}
