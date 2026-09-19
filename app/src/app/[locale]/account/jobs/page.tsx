"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ContentShell } from "@/components/layout/page-section";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchAnalysisJobStats } from "@/lib/analysis/actions";
import type { AnalysisJobStats } from "@/lib/db/analysis-jobs-service";
import type { AnalysisJob } from "@/types/models/analysis-job";
import { SystemCode } from "@/types/system-codes";
import {
  deriveDurationMs,
  formatDuration,
  truncateToken,
} from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  "all",
  SystemCode.ANALYSIS_COMPLETED,
  SystemCode.ANALYSIS_ERROR,
  SystemCode.ANALYSIS_TIMEOUT,
  SystemCode.ANALYSIS_CANCELLED,
  SystemCode.ANALYSIS_QUEUED,
  SystemCode.ANALYSIS_PROCESSING,
] as const;

const BADGE_CLASS: Record<string, string> = {
  [SystemCode.ANALYSIS_COMPLETED]: "bg-accent-green/12 text-accent-green [&_.badge-dot]:bg-accent-green",
  [SystemCode.ANALYSIS_TIMEOUT]: "bg-risk-medium/12 text-risk-medium [&_.badge-dot]:bg-risk-medium",
  [SystemCode.ANALYSIS_ERROR]: "bg-risk-high/12 text-risk-high [&_.badge-dot]:bg-risk-high",
  [SystemCode.ANALYSIS_QUEUED]: "bg-accent-violet/12 text-accent-violet [&_.badge-dot]:bg-accent-violet",
  [SystemCode.ANALYSIS_PROCESSING]: "bg-accent-blue/12 text-accent-blue [&_.badge-dot]:bg-accent-blue",
  [SystemCode.ANALYSIS_CANCELLED]: "bg-text-muted/12 text-text-muted [&_.badge-dot]:bg-text-muted",
};

function StatusBadge({ status }: { status?: string }) {
  const t = useTranslations("Jobs");
  const label = status ? (t.has(`status.${status}`) ? t(`status.${status}`) : status) : "—";
  const tone = status ? BADGE_CLASS[status] : "bg-surface-raised text-text-muted [&_.badge-dot]:bg-text-muted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        tone
      )}
    >
      <span className="badge-dot size-[5px] shrink-0 rounded-full" />
      {label}
    </span>
  );
}

function JobRowActions({ job, onShowError }: { job: AnalysisJob; onShowError: (job: AnalysisJob) => void }) {
  const t = useTranslations("Jobs");
  if (job.status === SystemCode.ANALYSIS_ERROR) {
    return (
      <button
        type="button"
        onClick={() => onShowError(job)}
        className="p-1 text-accent-green hover:text-accent-bright"
        title={t("viewError")}
        aria-label={t("viewError")}
      >
        <AlertTriangle className="size-4" />
      </button>
    );
  }
  if (job.status === SystemCode.ANALYSIS_TIMEOUT) {
    return (
      <button
        type="button"
        onClick={() => onShowError(job)}
        className="p-1 text-accent-green hover:text-accent-bright"
        title={t("viewTimeout")}
        aria-label={t("viewTimeout")}
      >
        <Clock className="size-4" />
      </button>
    );
  }
  if (
    job.status === SystemCode.ANALYSIS_QUEUED ||
    job.status === SystemCode.ANALYSIS_PROCESSING
  ) {
    return (
      <Link
        href={`/results/${job.id}`}
        className="p-1 text-accent-green hover:text-accent-bright"
        title={t("viewStatus")}
        aria-label={t("viewStatus")}
      >
        <Loader2 className="size-4 animate-spin" style={{ animationDuration: "1.6s" } as CSSProperties} />
      </Link>
    );
  }
  if (job.status === SystemCode.ANALYSIS_COMPLETED) {
    if (job.resultsAvailable) {
      return (
        <Link
          href={`/results/${job.id}`}
          className="p-1 text-accent-green hover:text-accent-bright"
          title={t("viewResults")}
          aria-label={t("viewResults")}
        >
          <FileText className="size-4" />
        </Link>
      );
    }
    return (
      <span className="cursor-not-allowed p-1 text-text-muted" title={t("resultsExpired")} aria-label={t("resultsExpired")}>
        <FileText className="size-4" />
      </span>
    );
  }
  return <span className="inline-block size-6 shrink-0" aria-hidden="true" />;
}

function JobErrorModal({
  job,
  onClose,
}: {
  job: AnalysisJob;
  onClose: () => void;
}) {
  const t = useTranslations("Jobs");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-bg/70 px-0 sm:px-4">
      <div className="flex max-h-full w-full flex-col rounded-t-lg border border-border bg-surface shadow-xl sm:my-10 sm:max-w-3xl sm:rounded-lg">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface p-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge status={job.status} />
            <span className="text-sm text-text-muted">{t("token")}</span>
            <span className="break-all font-mono text-xs text-text-primary">{job.id}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {tCommon("close")}
          </Button>
        </div>
        <div className="space-y-3 overflow-y-auto p-4">
          <p className="text-sm text-text-primary">
            <span className="text-text-muted">{t("created")}: </span>
            {job.createdAt ? format.dateTime(new Date(job.createdAt), "short") : "—"}
          </p>
          <p className="text-sm text-text-primary">
            <span className="text-text-muted">{t("duration")}: </span>
            {formatDuration(deriveDurationMs(job.startedAt, job.completedAt))}
          </p>
          <div>
            <p className="mb-2 text-sm text-text-muted">{t("errorMessage")}</p>
            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-bg/50 p-3 text-sm text-text-primary">
              {job.errorMessage || t("noErrorDetails")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <JobsContent />
    </ProtectedRoute>
  );
}

function JobsContent() {
  const t = useTranslations("Jobs");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const { isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AnalysisJobStats | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedError, setExpandedError] = useState<AnalysisJob | null>(null);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    const r = await fetchAnalysisJobStats();
    if (r.ok) setStats(r.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading) refreshStats();
  }, [authLoading, refreshStats]);

  const filteredJobs = useMemo(() => {
    let list = stats?.recentJobs ?? [];
    if (filter !== "all") list = list.filter((j) => j.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) => j.id.toLowerCase().includes(q));
    }
    return list;
  }, [stats, filter, search]);

  useEffect(() => {
    setPage(1);
  }, [filter, search, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageJobs = filteredJobs.slice(pageStart, pageStart + rowsPerPage);

  const statCells = stats
    ? [
        { label: t("totalJobs"), value: stats.summary.total },
        { label: t("last7d"), value: stats.summary.last7d },
        {
          label: t("status.analysis_queued"),
          value: stats.statusCounts.queued,
          className: "text-accent-violet",
        },
        {
          label: t("status.analysis_completed"),
          value: stats.statusCounts.completed,
          className: "text-accent-green",
        },
        { label: t("errors"), value: stats.statusCounts.error, className: "text-risk-high" },
        {
          label: t("timeouts"),
          value: stats.statusCounts.timeout,
          className: "text-risk-medium",
        },
        {
          label: t("avgRuntime"),
          value: formatDuration(stats.timings.avgRunMs),
          compact: true,
        },
        {
          label: t("avgQueue"),
          value: formatDuration(stats.timings.avgQueueMs),
          className: "text-text-muted",
          compact: true,
        },
      ]
    : [];

  const relative = (value?: Date | string | null) => {
    if (!value) return { label: "—", tooltip: "—" };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { label: "—", tooltip: "—" };
    return {
      label: format.relativeTime(date),
      tooltip: format.dateTime(date, "short"),
    };
  };

  const handleFilter = (key: string) => {
    setFilter(key);
    setSearch("");
  };

  return (
    <ContentShell wide data-full-bleed className="flex min-h-0 flex-1 flex-col gap-0 py-0">
      <div className="grid shrink-0 grid-cols-2 border-b border-border bg-surface sm:grid-cols-4 lg:grid-cols-8">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border-r border-border px-[18px] py-3.5 last:border-r-0"
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  …
                </p>
                <p className="text-xl font-semibold tabular-nums text-text-primary">—</p>
              </div>
            ))
          : statCells.map((s) => (
              <div
                key={s.label}
                className="border-r border-border px-[18px] py-3.5 last:border-r-0"
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  {s.label}
                </p>
                <p
                  className={cn(
                    "font-semibold tabular-nums tracking-tight",
                    s.compact ? "text-base" : "text-xl",
                    s.className ?? "text-text-primary"
                  )}
                >
                  {s.value}
                </p>
              </div>
            ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-bg px-[18px] py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[200px] border-border bg-surface pl-8 text-xs focus-visible:border-accent-green"
            />
          </div>
          <div className="flex overflow-hidden rounded-[7px] bg-border gap-px">
            {FILTER_OPTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleFilter(key)}
                className={cn(
                  "bg-surface px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                  filter === key
                    ? "bg-surface-raised text-text-primary"
                    : "text-text-muted hover:bg-surface-raised hover:text-text-primary"
                )}
              >
                {key === "all" ? t("all") : t(`status.${key}`)}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={refreshStats}
            disabled={loading}
            title={t("refresh")}
            aria-label={t("refresh")}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>
          <span className="text-xs text-text-muted">{t("recentSubmissions")}</span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em] text-text-muted uppercase">
                  {t("token")}
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em] text-text-muted uppercase">
                  {t("features")}
                </th>
                <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em] text-text-muted uppercase sm:table-cell">
                  {t("created")}
                </th>
                <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em] text-text-muted uppercase sm:table-cell">
                  {t("completed")}
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em] text-text-muted uppercase">
                  {t("duration")}
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold tracking-[0.08em] text-text-muted uppercase">
                  {t("statusHeader")}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageJobs.map((job) => {
                const created = relative(job.createdAt);
                const completed = relative(job.completedAt);
                return (
                  <tr
                    key={job.id}
                    className="border-b border-border transition-colors hover:bg-surface"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] text-text-muted" title={job.id}>
                      {truncateToken(job.id)}
                      <div className="mt-1 text-[11px] text-text-muted sm:hidden">
                        <span title={created.tooltip}>{created.label}</span>
                        {" · "}
                        <span title={completed.tooltip}>{completed.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11px] tabular-nums text-text-muted">
                      {job.featureCount ?? "—"}
                    </td>
                    <td className="hidden px-4 py-2.5 text-[11px] text-text-muted sm:table-cell">
                      <span title={created.tooltip}>{created.label}</span>
                    </td>
                    <td className="hidden px-4 py-2.5 text-[11px] text-text-muted sm:table-cell">
                      <span title={completed.tooltip}>{completed.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11px] tabular-nums text-text-primary">
                      {formatDuration(deriveDurationMs(job.startedAt, job.completedAt))}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <StatusBadge status={job.status} />
                        <JobRowActions job={job} onShowError={setExpandedError} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && pageJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    {stats?.recentJobs.length ? t("noMatches") : t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-surface px-4 py-2 text-xs text-text-muted">
          <span>{tCommon("rows")}</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="cursor-pointer appearance-none rounded-md border border-border bg-surface-raised py-0.5 pr-6 pl-2 text-xs text-text-primary outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <div className="flex-1" />
          <span className="whitespace-nowrap">
            {filteredJobs.length === 0
              ? tCommon("range", { from: 0, to: 0, total: 0 })
              : tCommon("range", { from: pageStart + 1, to: Math.min(pageStart + rowsPerPage, filteredJobs.length), total: filteredJobs.length })}
          </span>
          <button
            type="button"
            className="flex size-[26px] items-center justify-center rounded-md border border-border bg-surface-raised text-text-muted transition-colors hover:border-[#4a5560] hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label={tCommon("previousPage")}
          >
            <ChevronLeft className="size-3" />
          </button>
          <button
            type="button"
            className="flex size-[26px] items-center justify-center rounded-md border border-border bg-surface-raised text-text-muted transition-colors hover:border-[#4a5560] hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label={tCommon("nextPage")}
          >
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>

      {expandedError ? (
        <JobErrorModal job={expandedError} onClose={() => setExpandedError(null)} />
      ) : null}
    </ContentShell>
  );
}
