"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAdminStats } from "@/lib/api-client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    movieCount: 0,
    genreCount: 0,
    pendingReportCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Movies", value: stats.movieCount },
          { label: "Genres", value: stats.genreCount },
          { label: "Pending Reports", value: stats.pendingReportCount },
        ].map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border border-white/10 bg-finema-surface/50 p-6"
          >
            <p className="text-sm text-finema-muted mb-1">{card.label}</p>
            <p className="text-3xl font-bold">
              {loading ? "—" : card.value}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-white/10 bg-finema-surface/50 p-6"
      >
        <h3 className="text-lg font-medium mb-2">Quick actions</h3>
        <p className="text-finema-muted text-sm mb-4">
          Upload a new movie with automatic HLS transcoding.
        </p>
        <Link
          href="/admin/movies/new"
          className="inline-block px-5 py-2.5 rounded-lg bg-finema-accent text-white font-medium hover:bg-red-600 transition-colors"
        >
          Add Movie
        </Link>
        {stats.pendingReportCount > 0 && (
          <Link
            href="/admin/reports"
            className="inline-block ml-3 px-5 py-2.5 rounded-lg border border-white/20 text-finema-text font-medium hover:border-white/40 transition-colors"
          >
            Review {stats.pendingReportCount} report
            {stats.pendingReportCount === 1 ? "" : "s"}
          </Link>
        )}
      </motion.div>
    </div>
  );
}
