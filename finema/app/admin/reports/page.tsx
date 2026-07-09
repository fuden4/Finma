"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CommentReportDetail } from "@/db/types";
import { getAdminReports } from "@/lib/api-client";
import { ReportTable } from "@/components/admin/ReportTable";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<CommentReportDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminReports()
      .then((data) => setReports(data.reports))
      .finally(() => setLoading(false));
  }, []);

  function handleResolved(reportId: string) {
    setReports((prev) => prev.filter((report) => report.id !== reportId));
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Comment Reports</h2>
      <p className="text-finema-muted text-sm mb-6">
        Review reported comments and take moderation action.
      </p>

      {loading ? (
        <p className="text-finema-muted">Loading reports...</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ReportTable reports={reports} onResolved={handleResolved} />
        </motion.div>
      )}
    </div>
  );
}
