"use client";

import Link from "next/link";
import { useState } from "react";
import type { CommentReportDetail, ReportResolveAction } from "@/db/types";
import { resolveReport } from "@/lib/api-client";
import { moviePath } from "@/lib/content-paths";
import { CommentMedia } from "@/components/comments/CommentMedia";

interface ReportTableProps {
  reports: CommentReportDetail[];
  onResolved: (reportId: string) => void;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ReportTable({ reports, onResolved }: ReportTableProps) {
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(
    reportId: string,
    action: ReportResolveAction,
    confirmMessage?: string
  ) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setActingId(reportId);
    setError(null);

    try {
      await resolveReport(reportId, action);
      onResolved(reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActingId(null);
    }
  }

  if (reports.length === 0) {
    return (
      <p className="text-finema-muted text-sm">
        No pending reports. All clear.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {reports.map((report) => {
        const busy = actingId === report.id;

        return (
          <div
            key={report.id}
            className="rounded-xl border border-white/10 bg-finema-surface/50 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs text-finema-muted">
                  Reported {formatDate(report.created_at)}
                </p>
                <p className="text-sm text-finema-text mt-1">
                  By{" "}
                  <span className="font-medium">
                    {report.reporter_name ?? report.reporter_email}
                  </span>
                </p>
              </div>
              <Link
                href={moviePath({
                  id: report.movie_id,
                  slug: report.movie_slug,
                  title: report.movie_title,
                })}
                className="text-sm text-finema-accent hover:underline"
              >
                {report.movie_title}
              </Link>
            </div>

            <div className="rounded-lg bg-black/20 border border-white/5 p-3 mb-3">
              <p className="text-xs text-finema-muted mb-1">
                Comment by{" "}
                {report.comment_author_name ?? report.comment_author_email}
              </p>
              {report.comment_body.length > 0 && (
                <p className="text-sm text-finema-text whitespace-pre-wrap">
                  {report.comment_body}
                </p>
              )}
              {report.comment_media_type && report.comment_media_url && (
                <CommentMedia
                  mediaType={report.comment_media_type}
                  mediaUrl={report.comment_media_url}
                />
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs text-finema-muted mb-1">Report reason</p>
              <p className="text-sm text-finema-muted whitespace-pre-wrap">
                {report.reason}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleAction(report.id, "dismiss")}
                className="px-3 py-1.5 text-sm rounded border border-white/10 text-finema-muted hover:text-finema-text hover:border-white/30 transition-colors disabled:opacity-50"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void handleAction(
                    report.id,
                    "delete_comment",
                    "Delete this comment?"
                  )
                }
                className="px-3 py-1.5 text-sm rounded border border-orange-500/40 text-orange-300 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
              >
                Delete comment
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void handleAction(
                    report.id,
                    "suspend_user",
                    `Suspend ${report.comment_author_name ?? report.comment_author_email}?`
                  )
                }
                className="px-3 py-1.5 text-sm rounded border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
              >
                Suspend user
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void handleAction(
                    report.id,
                    "ban_user",
                    `Permanently delete ${report.comment_author_name ?? report.comment_author_email}'s account? This cannot be undone.`
                  )
                }
                className="px-3 py-1.5 text-sm rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                Ban user
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
