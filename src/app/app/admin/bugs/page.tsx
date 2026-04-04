'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bug, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'
const PAGE_SIZE = 20

type BugStatus = 'open' | 'triaged' | 'in_progress' | 'resolved'
type SortBy = 'created_at' | 'severity' | 'status'
type SortOrder = 'asc' | 'desc'
type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical'
type StatusFilter = 'all' | BugStatus

const BUG_STATUS_OPTIONS: Array<{ value: BugStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved (fixed)' },
]

const BUG_STATUS_SET = new Set<BugStatus>(['open', 'triaged', 'in_progress', 'resolved'])

function toBugStatus(value: unknown): BugStatus {
  if (typeof value === 'string' && BUG_STATUS_SET.has(value as BugStatus)) return value as BugStatus
  return 'open'
}

interface BugReport {
  id: string
  user_id: string | null
  reporter_email: string
  title: string
  description: string
  severity: string
  status: BugStatus
  page_url: string | null
  created_at: string
  updated_at: string | null
}

function BugSeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
  }
  return <span className={cn('badge border text-xs', map[severity] ?? 'bg-gray-50 text-gray-600 border-gray-200')}>{severity}</span>
}

function BugStatusBadge({ status }: { status: BugStatus }) {
  const map: Record<BugStatus, string> = {
    open: 'bg-red-50 text-red-700 border-red-200',
    triaged: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    resolved: 'bg-green-50 text-green-700 border-green-200',
  }
  return <span className={cn('badge border text-xs', map[status])}>{status}</span>
}

export default function AdminBugReportsPage() {
  const router = useRouter()

  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [sortBy, setSortBy] = useState<SortBy>('created_at')
  const [order, setOrder] = useState<SortOrder>('desc')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [activeBugReportId, setActiveBugReportId] = useState<string | null>(null)
  const [nextBugStatus, setNextBugStatus] = useState<BugStatus>('open')
  const [savingBugStatus, setSavingBugStatus] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  const activeBugReport = useMemo(() => {
    if (!activeBugReportId) return null
    return reports.find((report) => report.id === activeBugReportId) ?? null
  }, [reports, activeBugReportId])

  useEffect(() => {
    void loadReports(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, order, severityFilter, statusFilter])

  useEffect(() => {
    if (!activeBugReportId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveBugReportId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeBugReportId])

  useEffect(() => {
    if (activeBugReport) {
      setNextBugStatus(activeBugReport.status)
    }
  }, [activeBugReport])

  const loadReports = async (initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sortBy,
        order,
        severity: severityFilter,
        status: statusFilter,
      })

      const res = await fetch(`/api/admin/bug-reports?${params.toString()}`)
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true)
        router.replace('/')
        return
      }
      const payload = await res.json()

      if (!res.ok) throw new Error(payload?.error || 'Failed to load bug reports')

      const normalizedReports: BugReport[] = (payload.reports ?? []).map((report: any) => ({
        id: String(report.id),
        user_id: report.user_id ? String(report.user_id) : null,
        reporter_email: String(report.reporter_email ?? 'Unknown'),
        title: String(report.title ?? 'Untitled bug'),
        description: String(report.description ?? ''),
        severity: String(report.severity ?? 'medium'),
        status: toBugStatus(report.status),
        page_url: report.page_url ? String(report.page_url) : null,
        created_at: String(report.created_at),
        updated_at: report.updated_at ? String(report.updated_at) : null,
      }))

      setReports(normalizedReports)
      setPage(Number(payload.page ?? page))
      setTotalPages(Number(payload.totalPages ?? 1))
      setTotal(Number(payload.total ?? normalizedReports.length))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load bug reports'
      toast.error(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const saveBugStatus = async () => {
    if (!activeBugReport) return

    setSavingBugStatus(true)
    try {
      const response = await fetch(`/api/admin/bug-reports/${activeBugReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextBugStatus }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Could not update bug report status')
      }

      const updatedStatus = toBugStatus(payload?.report?.status)
      const updatedUpdatedAt = payload?.report?.updated_at ? String(payload.report.updated_at) : activeBugReport.updated_at

      setReports((prev) =>
        prev.map((report) =>
          report.id === activeBugReport.id
            ? {
                ...report,
                status: updatedStatus,
                updated_at: updatedUpdatedAt,
              }
            : report
        )
      )
      setNextBugStatus(updatedStatus)
      toast.success('Bug report status updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update bug report status'
      toast.error(message)
    } finally {
      setSavingBugStatus(false)
    }
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-muted text-sm">Checking access...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-charcoal">All Bug Reports</h1>
            <p className="text-sm text-muted mt-1">
              {total} total reports. Page {page} of {totalPages}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/admin" className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
            <button onClick={() => void loadReports(false)} disabled={refreshing} className="btn-ghost flex items-center gap-2">
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="label">Sort by</span>
            <select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
              <option value="created_at">Submitted date</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Order</span>
            <select className="input" value={order} onChange={(event) => setOrder(event.target.value as SortOrder)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Severity</span>
            <select
              className="input"
              value={severityFilter}
              onChange={(event) => {
                setPage(1)
                setSeverityFilter(event.target.value as SeverityFilter)
              }}
            >
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Status</span>
            <select
              className="input"
              value={statusFilter}
              onChange={(event) => {
                setPage(1)
                setStatusFilter(event.target.value as StatusFilter)
              }}
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="triaged">Triaged</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100">
            <h2 className="font-semibold text-charcoal">Bug reports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sage-100 bg-sage-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Reporter</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Severity</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted text-sm">
                      Loading bug reports...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted text-sm">
                      No bug reports for this filter
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-sage-50/40 transition-colors align-top">
                      <td className="px-6 py-3.5">
                        <button type="button" onClick={() => setActiveBugReportId(report.id)} className="font-medium text-charcoal hover:underline text-left">
                          {report.title}
                        </button>
                        <div className="text-xs text-muted mt-1 max-w-lg whitespace-pre-wrap line-clamp-2">{report.description}</div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted">{report.reporter_email}</td>
                      <td className="px-6 py-3.5">
                        <BugSeverityBadge severity={report.severity} />
                      </td>
                      <td className="px-6 py-3.5">
                        <BugStatusBadge status={report.status} />
                      </td>
                      <td className="px-6 py-3.5 text-muted">{formatDate(report.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-sage-100 flex items-center justify-between">
            <button
              type="button"
              className="btn-secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <p className="text-xs text-muted">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <button
              type="button"
              className="btn-secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {activeBugReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/50"
            onClick={() => setActiveBugReportId(null)}
            aria-label="Close bug report details"
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-sage-100 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-sage-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-500" />
                <h3 className="text-lg font-semibold text-charcoal">{activeBugReport.title}</h3>
              </div>
              <button type="button" onClick={() => setActiveBugReportId(null)} className="btn-ghost px-2 py-2" aria-label="Close panel">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto space-y-5">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted mb-1">Reporter</p>
                  <p className="text-charcoal">{activeBugReport.reporter_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Submitted</p>
                  <p className="text-charcoal">{formatDate(activeBugReport.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Severity</p>
                  <BugSeverityBadge severity={activeBugReport.severity} />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Current status</p>
                  <BugStatusBadge status={activeBugReport.status} />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted mb-1">Page URL</p>
                {activeBugReport.page_url ? (
                  <a href={activeBugReport.page_url} target="_blank" rel="noopener noreferrer" className="text-sm text-sage-700 hover:underline break-all">
                    {activeBugReport.page_url}
                  </a>
                ) : (
                  <p className="text-sm text-muted">Not provided</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted mb-1">Full report</p>
                <div className="bg-sage-50 rounded-xl p-4 text-sm text-charcoal whitespace-pre-wrap">{activeBugReport.description}</div>
              </div>

              <div className="pt-2">
                <label htmlFor="bug-status" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Update status
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <select
                    id="bug-status"
                    className="input flex-1"
                    value={nextBugStatus}
                    onChange={(event) => setNextBugStatus(toBugStatus(event.target.value))}
                    disabled={savingBugStatus}
                  >
                    {BUG_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => void saveBugStatus()}
                    disabled={savingBugStatus || nextBugStatus === activeBugReport.status}
                    className="btn-primary"
                  >
                    {savingBugStatus ? 'Saving...' : 'Save status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
