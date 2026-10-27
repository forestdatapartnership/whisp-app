'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl';
import { ChevronRight, Download, RefreshCw, Search } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ContentShell } from '@/components/layout/page-section';
import { ResultsPagination } from '@/components/results/results-pagination';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';
import { fetchFeedback } from '@/lib/feedback/actions';
import { FEEDBACK_QUESTIONS, sortOptions } from '@/lib/feedback/questions';
import { useSystemMessage } from '@/lib/shared/use-system-message';
import { cn } from '@/lib/utils';
import { downloadBlob, rowsToCsv, timestampFilename } from '@/lib/utils/export';
import type { FeedbackResponse } from '@/lib/db/feedback-service';

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted';
const MAX_CHART_ROWS = 5;
const choiceQuestions = FEEDBACK_QUESTIONS.filter((q) => q.options);
const textQuestions = FEEDBACK_QUESTIONS.filter((q) => !q.options);
const profileQuestions = choiceQuestions.filter((q) => !q.stars);
const ratingQuestion = FEEDBACK_QUESTIONS.find((q) => q.stars);

// Built from the stored answers, not the current survey, so answers to retired questions still show; current ones keep survey order.
function answeredQuestions(responses: FeedbackResponse[]) {
  const configured = FEEDBACK_QUESTIONS.map((q) => q.name);
  const stored = [...new Set(responses.flatMap((r) => Object.keys(r.answers)))];
  return [
    ...configured.filter((name) => stored.includes(name)),
    ...stored.filter((name) => !configured.includes(name)).sort(),
  ];
}

function exportCsv(responses: FeedbackResponse[]) {
  const questions = answeredQuestions(responses);
  // Excel runs a cell starting with one of these characters as a formula.
  const safe = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);
  const rows = responses.map((r) => ({
    submitted_at_utc: r.createdAt.slice(0, 19).replace('T', ' '),
    email: r.email,
    ...Object.fromEntries(questions.map((name) => [name, r.answers[name] ? safe(r.answers[name]) : ''])),
  }));
  // The byte-order mark makes Excel read the file as UTF-8, so accented answers stay readable.
  const csv = '\uFEFF' + rowsToCsv(['submitted_at_utc', 'email', ...questions], rows);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), timestampFilename('csv', 'feedback'));
}

function FeedbackResults() {
  const t = useTranslations('Feedback');
  const locale = useLocale();
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const systemMessage = useSystemMessage();
  const [responses, setResponses] = useState<FeedbackResponse[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchFeedback();
    if (result.ok) setResponses(result.data);
    else setError(systemMessage(result.code, result.args));
    setLoading(false);
  }, [systemMessage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, rowsPerPage]);

  const all = useMemo(() => responses ?? [], [responses]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return all.filter(
      (r) =>
        (!filter || r.answers[filter]) &&
        (!query || [r.email ?? '', ...Object.values(r.answers)].some((v) => v.toLowerCase().includes(query)))
    );
  }, [all, filter, search]);

  const questionLabel = (name: string) => (t.has(`questions.${name}.label`) ? t(`questions.${name}.label`) : name);
  const answerLabel = (name: string, value: string) => {
    if (name === ratingQuestion?.name) return `${value} ★`;
    const key = `questions.${name}.options.${value}`;
    return t.has(key) ? t(key) : value;
  };
  const commentOf = (r: FeedbackResponse) =>
    filter
      ? r.answers[filter]
      : answeredQuestions([r])
          .filter((name) => !choiceQuestions.some((q) => q.name === name))
          .map((name) => r.answers[name])
          .join(' · ');

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" message={error} />
      </div>
    );
  }

  const ratings = ratingQuestion ? all.map((r) => Number(r.answers[ratingQuestion.name])).filter(Boolean) : [];
  const average = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
  const stats = [
    { label: 'Responses', value: format.number(all.length) },
    {
      label: 'Average rating',
      value: average ? `${format.number(average, { maximumFractionDigits: 1 })} / ${ratingQuestion?.options?.length}` : '—',
    },
    { label: 'Signed in', value: format.number(all.filter((r) => r.email).length) },
    { label: 'Anonymous', value: format.number(all.filter((r) => !r.email).length) },
  ];

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const thClass = `px-4 py-2.5 text-left ${labelClass}`;

  return (
    <>
      <div className="grid shrink-0 grid-cols-2 border-b border-border bg-surface sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-r border-border px-[18px] py-3.5 last:border-r-0">
            <p className={`mb-1 ${labelClass}`}>{s.label}</p>
            <p className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">{responses ? s.value : '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid shrink-0 gap-4 border-b border-border p-[18px] md:grid-cols-3 lg:grid-cols-5">
        {choiceQuestions.map(({ name, options = [], stars }) => {
          const ordered = stars ? options : sortOptions(options, (option) => answerLabel(name, option), locale);
          const counts = ordered.map((option) => all.filter((r) => r.answers[name] === option).length);
          const answered = counts.reduce((sum, c) => sum + c, 0);
          const columns = Math.ceil(options.length / MAX_CHART_ROWS);
          return (
            <div key={name} className={cn('rounded-md border border-border bg-surface p-4', columns > 1 && 'md:col-span-2')}>
              <p className={`mb-3 ${labelClass}`}>{questionLabel(name)}</p>
              <div
                className="grid gap-x-6 gap-y-2.5 md:auto-cols-fr md:grid-flow-col"
                style={{ gridTemplateRows: `repeat(${Math.min(options.length, MAX_CHART_ROWS)}, auto)` }}
              >
                {ordered.map((option, i) => {
                  const percent = answered ? Math.round((counts[i] / answered) * 100) : 0;
                  return (
                    <div key={option} title={`${answerLabel(name, option)}: ${counts[i]} (${percent}%)`}>
                      <div className="mb-1 flex justify-between gap-2 text-[11px]">
                        <span className="truncate text-text-muted">{answerLabel(name, option)}</span>
                        <span className="shrink-0 tabular-nums text-text-primary">
                          {counts[i]} <span className="text-text-muted">· {percent}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-bg">
                        <div className="h-full rounded-full bg-accent-green/60" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-bg px-[18px] py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search answers or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[200px] border-border bg-surface pl-8 text-xs focus-visible:border-accent-green"
          />
        </div>
        <div className="flex gap-px overflow-hidden rounded-[7px] bg-border">
          {[null, ...textQuestions.map((q) => q.name)].map((name) => (
            <button
              key={name ?? 'all'}
              type="button"
              onClick={() => setFilter(name)}
              aria-pressed={filter === name}
              title={name ? questionLabel(name) : undefined}
              className={cn(
                'bg-surface px-3 py-1.5 text-xs whitespace-nowrap capitalize transition-colors',
                filter === name
                  ? 'bg-surface-raised text-text-primary'
                  : 'text-text-muted hover:bg-surface-raised hover:text-text-primary'
              )}
            >
              {name ?? 'All'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={load}
          disabled={loading}
          title="Refresh"
          aria-label="Refresh"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
        </Button>
        <Button size="sm" onClick={() => exportCsv(filtered)} disabled={!filtered.length}>
          <Download />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-surface">
            <tr className="border-b border-border">
              <th className="w-0 pl-4" />
              <th className={thClass}>Submitted</th>
              <th className={thClass}>Respondent</th>
              <th className={thClass}>Rating</th>
              <th className={thClass}>Comment</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => {
              const expanded = expandedId === r.id;
              const date = new Date(r.createdAt);
              const rating = ratingQuestion && r.answers[ratingQuestion.name];
              return (
                <Fragment key={r.id}>
                  <tr
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                    className={cn(
                      'cursor-pointer border-b border-border align-top transition-colors hover:bg-surface',
                      expanded && 'border-b-0 bg-surface'
                    )}
                  >
                    <td className="w-0 py-2.5 pl-4">
                      <button type="button" aria-expanded={expanded} aria-label="Details" className="flex text-text-muted">
                        <ChevronRight className={cn('size-3.5 transition-transform', expanded && 'rotate-90')} />
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[11px] text-text-muted" title={format.dateTime(date, 'short')}>
                      {format.relativeTime(date, now)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[11px]">
                      <p className="text-text-primary">{r.email ?? 'Anonymous'}</p>
                      <p className="text-text-muted">
                        {profileQuestions
                          .filter((q) => r.answers[q.name])
                          .map((q) => answerLabel(q.name, r.answers[q.name]))
                          .join(' · ')}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-text-primary">{rating ? `${rating} ★` : '—'}</td>
                    <td className="w-full max-w-0 px-4 py-2.5">
                      <p className="truncate text-text-primary">{commentOf(r) || '—'}</p>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-border bg-surface">
                      <td />
                      <td colSpan={4} className="px-4 pt-1 pb-4">
                        <dl className="max-w-3xl space-y-3 border-l-2 border-accent-green/60 pl-4">
                          {answeredQuestions([r]).map((name) => (
                            <div key={name}>
                              <dt className="text-[11px] text-text-muted">{questionLabel(name)}</dt>
                              <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-text-primary">
                                {answerLabel(name, r.answers[name])}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  {!responses ? 'Loading…' : all.length ? 'No matching responses.' : 'No feedback yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ResultsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={filtered.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </>
  );
}

function AdminFeedback() {
  const { isAdmin } = useAuth();
  return (
    <ContentShell wide data-full-bleed className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto py-0">
      {isAdmin ? <FeedbackResults /> : <p className="p-6 text-sm text-text-muted">Only administrators can view this page.</p>}
    </ContentShell>
  );
}

export default function AdminFeedbackPage() {
  return (
    <ProtectedRoute>
      <AdminFeedback />
    </ProtectedRoute>
  );
}
