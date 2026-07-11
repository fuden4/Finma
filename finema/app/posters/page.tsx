import type { Metadata } from "next";
import { PostersContent } from "@/components/posters/PostersContent";

export const metadata: Metadata = {
  title: "Posters | Finema",
  description: "Browse and download cinematic posters from Finema.",
};

export default function PostersPage() {
  return <PostersContent />;
}
