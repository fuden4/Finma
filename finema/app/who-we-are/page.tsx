import type { Metadata } from "next";
import { WhoWeAreContent } from "@/components/about/WhoWeAreContent";

export const metadata: Metadata = {
  title: "Who We Are | Finema",
  description: "Meet the team behind Finema — a cinematic streaming platform for movie lovers.",
};

export default function WhoWeArePage() {
  return <WhoWeAreContent />;
}
