"use client";

import { Fragment, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { deriveDurationMs, formatDateTime, formatDuration, formatRelative } from "@/lib/utils/formatters";

type Summary = {
  total: number;
  last24h: number;
  last7d: number;
};

type StatusCounts = {
  processing: number;
  completed: number;
  error: number;
  timeout: number;
};

type Timings = {
  avgRunMs: number | null;
  p50RunMs: number | null;
  avgQueueMs: number | null;
};

type JobRow = {
  token: string;
  status: string;
  featureCount: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  resultsAvailable: boolean;
};

type StatsResponse = {
  summary: Summary;
  statusCounts: StatusCounts;
  timings: Timings;
  recentJobs: JobRow[];
};

const statusStyles: Record<string, string> = {
  analysis_processing: "bg-blue-500/20 text-blue-300",
  analysis_completed: "bg-green-500/20 text-green-300",
  analysis_error: "bg-red-500/20 text-red-300",
  analysis_timeout: "bg-yellow-500/20 text-yellow-200"
};

const statusLabels: Record<string, string> = {
  analysis_processing: "Processing",
  analysis_completed: "Completed",
  analysis_error: "Error",
  analysis_timeout: "Timeout"
};

const StatusIcon = ({ name, className, style }: { name: "doc" | "spinner" | "alert" | "timer"; className?: string; style?: CSSProperties }) => {
  if (name === "doc") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    );
  }
  if (name === "spinner") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" />
        <path d="m16.2 7.8 2.8-2.8" />
        <path d="M18 12h4" />
        <path d="m16.2 16.2 2.8 2.8" />
        <path d="M12 18v4" />
        <path d="m4 4 2.8 2.8" />
        <path d="M2 12h4" />
        <path d="m4 20 2.8-2.8" />
      </svg>
    );
  }
  if (name === "alert") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    );
  }
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
};

const SectionCard = ({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    {(title || subtitle) && (
      <div className="flex items-center justify-between mb-4">
        {title ? <h2 className="text-xl font-semibold text-white">{title}</h2> : <div />}
        {subtitle ? <span className="text-sm text-gray-400">{subtitle}</span> : null}
      </div>
    )}
    {children}
  </div>
);

const StatTile = ({ label, value, helper }: { label: string; value: string | number; helper?: string }) => (
  <div className="bg-gray-900 rounded p-3 border border-gray-700 flex flex-col gap-1">
    <p className="text-xs sm:text-sm text-gray-400">{label}</p>
    <p className="text-xl sm:text-2xl font-semibold text-white">{value}</p>
    {helper ? <p className="text-[11px] text-gray-500">{helper}</p> : null}
  </div>
);

export default function JobStatsPage() {
  const { isAuthenticated, loading: authLoading } = useUserProfile(true);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedError, setExpandedError] = useState<JobRow | null>(null);

  const refreshStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analysis-jobs/stats", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load statistics");
      }
      const data: StatsResponse = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      refreshStats();
    }
  }, [authLoading]);

  const visibleJobs = stats
    ? stats.recentJobs.filter((job) => statusFilter === "all" || job.status === statusFilter)
    : [];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analysis Job Statistics</h1>
          <p className="text-gray-400 mt-2">Monitor volume, status, and latency for your analyses.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-800 text-gray-200 rounded-md border border-gray-700 hover:bg-gray-700"
          >
            API Dashboard
          </Link>
          <Button onClick={refreshStats} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Refresh
          </Button>
        </div>
      </div>

      {stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 mb-6">
            <SectionCard title="Summary">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <StatTile label="Total jobs" value={stats.summary.total} />
                <StatTile label="Last 7 days" value={stats.summary.last7d} />
                <StatTile label="Last 24 hours" value={stats.summary.last24h} />
                <StatTile label="Active" value={stats.statusCounts.processing} helper={`${stats.statusCounts.completed} completed`} />
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            <SectionCard title="Status breakdown" subtitle="Latest totals">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {Object.entries(stats.statusCounts).map(([key, value]) => (
                  <StatTile key={key} label={statusLabels[key] ?? key} value={value} />
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Latency" subtitle="Calculated from started/completed jobs">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <StatTile label="Avg queue" value={formatDuration(stats.timings.avgQueueMs)} />
                <StatTile label="Avg runtime" value={formatDuration(stats.timings.avgRunMs)} />
                <StatTile label="Median runtime" value={formatDuration(stats.timings.p50RunMs)} />
              </div>
            </SectionCard>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent jobs</h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="hidden md:inline">Latest 20 submissions</span>
                <div className="flex gap-2">
                  {["all", "analysis_processing", "analysis_completed", "analysis_error", "analysis_timeout"].map((key) => (
                    <Button
                      key={key}
                      variant="secondary"
                      size="sm"
                      onClick={() => setStatusFilter(key)}
                      className={`px-3 py-1 text-xs ${statusFilter === key ? "bg-gray-700 text-white" : "bg-gray-900 text-gray-300"}`}
                    >
                      {key === "all" ? "All" : statusLabels[key] ?? key}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            {visibleJobs.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Token</TableHead>
                    <TableHead className="text-right">Features</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Created</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Completed</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleJobs.map((job) => (
                    <Fragment key={job.token}>
                      <TableRow className="hover:bg-gray-750">
                        <TableCell className="font-mono text-xs text-gray-100 max-w-[220px] truncate" title={job.token}>
                          {job.token}
                          <div className="mt-1 text-xs text-gray-400 sm:hidden">
                            <span title={formatDateTime(job.createdAt)}>{formatRelative(job.createdAt).label}</span>
                            {" • "}
                            <span title={formatDateTime(job.completedAt)}>{formatRelative(job.completedAt).label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-gray-200">
                          {job.featureCount ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-gray-300 hidden sm:table-cell">
                          {(() => {
                            const { label, tooltip } = formatRelative(job.createdAt);
                            return <span title={tooltip}>{label}</span>;
                          })()}
                        </TableCell>
                        <TableCell className="text-right text-gray-300 hidden sm:table-cell">
                          {(() => {
                            const { label, tooltip } = formatRelative(job.completedAt);
                            return <span title={tooltip}>{label}</span>;
                          })()}
                        </TableCell>
                        <TableCell className="text-right text-gray-200">
                          {formatDuration(deriveDurationMs(job.startedAt, job.completedAt))}
                        </TableCell>
                        <TableCell className="flex items-center justify-end gap-2 text-gray-200">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[job.status] || "bg-gray-700 text-gray-200"}`}
                          >
                            {statusLabels[job.status] ?? job.status}
                          </span>
                        {job.status === "analysis_error" ? (
                          <button
                            onClick={() => setExpandedError(job)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="View error details"
                            aria-label="View error details"
                          >
                            <StatusIcon name="alert" className="h-4 w-4" />
                          </button>
                        ) : job.status === "analysis_timeout" ? (
                          <button
                            onClick={() => setExpandedError(job)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="View timeout details"
                            aria-label="View timeout details"
                          >
                            <StatusIcon name="timer" className="h-4 w-4" />
                          </button>
                        ) : job.status === "analysis_completed" ? (
                          job.resultsAvailable ? (
                            <Link
                              href={`/results/${job.token}`}
                              title="View results"
                              aria-label="View results"
                              className="text-blue-400 hover:text-blue-300 p-1"
                            >
                              <StatusIcon name="doc" className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span
                              className="text-gray-500 cursor-not-allowed p-1"
                              title="Results expired"
                              aria-label="Results expired"
                            >
                              <StatusIcon name="doc" className="h-4 w-4" />
                            </span>
                          )
                        ) : (
                          <Link
                            href={`/results/${job.token}`}
                            title="View status"
                            aria-label="View status"
                            className="text-blue-400 hover:text-blue-300 p-1"
                          >
                            <StatusIcon name="spinner" className="h-4 w-4 animate-spin" style={{ animationDuration: "1.6s" }} />
                          </Link>
                        )}
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-400">No jobs yet.</p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-300">No data available.</p>
        </div>
      )}

      {expandedError ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4">
          <div className="w-full sm:max-w-3xl bg-gray-900 border border-gray-800 shadow-xl max-h-full flex flex-col rounded-t-lg sm:rounded-lg sm:my-10">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[expandedError.status] || "bg-gray-700 text-gray-200"}`}
                >
                  {statusLabels[expandedError.status] ?? expandedError.status}
                </span>
                <span className="text-gray-400 text-sm">Token</span>
                <span className="font-mono text-xs text-gray-100 break-all">{expandedError.token}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setExpandedError(null)}>
                Close
              </Button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">Created: </span>
                <span>{formatDateTime(expandedError.createdAt)}</span>
              </div>
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">Duration: </span>
                <span>{formatDuration(deriveDurationMs(expandedError.startedAt, expandedError.completedAt))}</span>
              </div>
              <div className="text-sm">
                <div className="text-gray-400 mb-2">Error message</div>
                <div className="text-gray-100 whitespace-pre-wrap max-h-80 overflow-y-auto border border-gray-800 rounded-md p-3 bg-gray-950/50">
                  {expandedError.errorMessage || "No error details recorded."}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

