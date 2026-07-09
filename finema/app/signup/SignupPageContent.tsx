"use client";

import { motion } from "framer-motion";
import { SignupForm } from "@/components/auth/SignupForm";

export function SignupPageContent() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-finema-accent/30 via-finema-bg to-finema-bg"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_#e50914_0%,_transparent_50%)]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_#4caf50_0%,_transparent_40%)]"
      />

      <div className="relative z-10 w-full flex justify-center">
        <SignupForm />
      </div>
    </div>
  );
}
