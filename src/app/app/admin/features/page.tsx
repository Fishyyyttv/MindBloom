'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lightbulb, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'

const PAGE_SIZE = 20

type FeatureStatus = 'open' | 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'declined'
type SortBy = 'created_at' | 'impact' | 'status'
type SortOrder = 'asc' | 'desc'
type ImpactFilter = 'all' | 'nice_to_have' | 'helpful' | 'high_impact' | 'game_changer'
type CategoryFilter = 'all' | 'ai' | 'wellness_tools' | 'journal' | 'mood' | 'design' | 'integrations' | 'other'
type StatusFilter = 'all' | FeatureStatus

const FEATURE_STATUS_OPTIONS: Array<{ value: FeatureStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'declined', label: 'Declined' },
]

const FEATURE_STATUS_SET = new Set<FeatureStatus>(['open', 'under_review', 'planned', 'in_progress', 'shipped', 'declined'])

function toFeatureStatus(value: unknown): FeatureStatus {
  if (typeof value === 'string' && FEATURE_STATUS_SET.has(value as FeatureStatus)) return value as FeatureStatus
  return 'open'
}

interface FeatureRequest {
  id: string
  user_id: string | null
  requester_email: string
  title: string
  description: string
  impact: string
  category: string
  status: FeatureStatus
  page_url: string | null
  created_at: string
  updated_at: string | null
}

function FeatureImpactBadge({ impact }: { impact: string }) {
  const map: Record<string, string> = {
    nice_to_have: 'bg-blue-50 text-blue-700 border-blue-200',
    helpful: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    high_impact: 'bg-orange-50 text-orange-700 border-orange-200',
    game_changer: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return <span className={cn('badge border text-xs', map[impact] ?? 'bg-gray-50 text-gray-600 border-gray-200')}>{impact}</span>
}

function FeatureStatusBadge({ status }: { status: FeatureStatus }) {
  const map: Record<FeatureStatus, string> = {
    open: 'bg-red-50 text-red-700 border-red-200',
    under_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    planned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped: 'bg-green-50 text-green-700 border-green-200',
    declined: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return <span className={cn('badge border text-xs', map[status])}>{status}</span>
}

function humanizeCategory(category: string): string {
  const labels: Record<string, string> = {
    ai: 'AI Companion',
    wellness_tools: 'Wellness Tools',
    journal: 'Journal/Diary',
    mood: 'Mood Tracking',
    design: 'UI/Design',
    integrations: 'Integrations',
    other: 'Other',
  }
  return labels[category] ?? category
}

export default function AdminFeatureRequestsPage() {
  const router = useRouter()

  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [sortBy, setSortBy] = useState<SortBy>('created_at')
  const [order, setOrder] = useState<SortOrder>('desc')
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [nextStatus, setNextStatus] = useState<FeatureStatus>('open')
  const [savingStatus, setSavingStatus] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  const activeRequest = useMemo(() => {
    if (!activeRequestId) return null
    return requests.find((request) => request.id === activeRequestId) ?? null
  }, [requests, activeRequestId])

  useEffect(() => {
    void loadRequests(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, order, impactFilter, statusFilter, categoryFilter])

  useEffect(() => {
    if (!activeRequestId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveRequestId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeRequestId])

  useEffect(() => {
    if (activeRequest) {
      setNextStatus(activeRequest.status)
    }
  }, [activeRequest])

  const loadRequests = async (initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sortBy,
        order,
        impact: impactFilter,
        status: statusFilter,
        category: categoryFilter,
      })

      const res = await fetch(`/api/admin/feature-requests?${params.toString()}`)
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true)
        router.replace('/')
        return
      }
      const payload = await res.json()

      if (!res.ok) throw new Error(payload?.error || 'Failed to load feature requests')

      const normalizedRequests: FeatureRequest[] = (payload.requests ?? []).map((item: any) => ({
        id: String(item.id),
        user_id: item.user_id ? String(item.user_id) : null,
        requester_email: String(item.requester_email ?? 'Unknown'),
        title: String(item.title ?? 'Untitled request'),
        description: String(item.description ?? ''),
        impact: String(item.impact ?? 'helpful'),
        category: String(item.category ?? 'other'),
        status: toFeatureStatus(item.status),
        page_url: item.page_url ? String(item.page_url) : null,
        created_at: String(item.created_at),
        updated_at: item.updated_at ? String(item.updated_at) : null,
      }))

      setRequests(normalizedRequests)
      setPage(Number(payload.page ?? page))
      setTotalPages(Number(payload.totalPages ?? 1))
      setTotal(Number(payload.total ?? normalizedRequests.length))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load feature requests'
      toast.error(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const saveFeatureStatus = async () => {
    if (!activeRequest) return

    setSavingStatus(true)
    try {
      const response = await fetch(`/api/admin/feature-requests/${activeRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Could not update feature request status')
      }

      const updatedStatus = toFeatureStatus(payload?.request?.status)
      const updatedUpdatedAt = payload?.request?.updated_at ? String(payload.request.updated_at) : activeRequest.updated_at

      setRequests((prev) =>
        prev.map((item) =>
          item.id === activeRequest.id
            ? {
                ...item,
                status: updatedStatus,
                updated_at: updatedUpdatedAt,
              }
            : item
        )
      )
      setNextStatus(updatedStatus)
      toast.success('Feature request status updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update feature request status'
      toast.error(message)
    } finally {
      setSavingStatus(false)
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
            <h1 className="font-serif text-3xl text-charcoal">All Feature Requests</h1>
            <p className="text-sm text-muted mt-1">
              {total} total requests. Page {page} of {totalPages}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/admin" className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
            <button onClick={() => void loadRequests(false)} disabled={refreshing} className="btn-ghost flex items-center gap-2">
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="block">
            <span className="label">Sort by</span>
            <select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
              <option value="created_at">Submitted date</option>
              <option value="impact">Impact</option>
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
            <span className="label">Impact</span>
            <select
              className="input"
              value={impactFilter}
              onChange={(event) => {
                setPage(1)
                setImpactFilter(event.target.value as ImpactFilter)
              }}
            >
              <option value="all">All impact levels</option>
              <option value="nice_to_have">Nice to have</option>
              <option value="helpful">Helpful</option>
              <option value="high_impact">High impact</option>
              <option value="game_changer">Game changer</option>
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
              <option value="under_review">Under review</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In progress</option>
              <option value="shipped">Shipped</option>
              <option value="declined">Declined</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Category</span>
            <select
              className="input"
              value={categoryFilter}
              onChange={(event) => {
                setPage(1)
                setCategoryFilter(event.target.value as CategoryFilter)
              }}
            >
              <option value="all">All categories</option>
              <option value="ai">AI Companion</option>
              <option value="wellness_tools">Wellness Tools</option>
              <option value="journal">Journal/Diary</option>
              <option value="mood">Mood Tracking</option>
              <option value="design">UI/Design</option>
              <option value="integrations">Integrations</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100">
            <h2 className="font-semibold text-charcoal">Feature requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sage-100 bg-sage-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Requester</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Impact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted text-sm">
                      Loading feature requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted text-sm">
                      No feature requests for this filter
                    </td>
                  </tr>
                ) : (
                  requests.map((item) => (
                    <tr key={item.id} className="hover:bg-sage-50/40 transition-colors align-top">
                      <td className="px-6 py-3.5">
                        <button type="button" onClick={() => setActiveRequestId(item.id)} className="font-medium text-charcoal hover:underline text-left">
                          {item.title}
                        </button>
                        <div className="text-xs text-muted mt-1 max-w-lg whitespace-pre-wrap line-clamp-2">{item.description}</div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted">{item.requester_email}</td>
                      <td className="px-6 py-3.5">
                        <FeatureImpactBadge impact={item.impact} />
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted">{humanizeCategory(item.category)}</td>
                      <td className="px-6 py-3.5">
                        <FeatureStatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-3.5 text-muted">{formatDate(item.created_at)}</td>
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

      {activeRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/50"
            onClick={() => setActiveRequestId(null)}
            aria-label="Close feature request details"
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-sage-100 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-sage-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="text-lg font-semibold text-charcoal">{activeRequest.title}</h3>
              </div>
              <button type="button" onClick={() => setActiveRequestId(null)} className="btn-ghost px-2 py-2" aria-label="Close panel">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto space-y-5">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted mb-1">Requester</p>
                  <p className="text-charcoal">{activeRequest.requester_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Submitted</p>
                  <p className="text-charcoal">{formatDate(activeRequest.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Impact</p>
                  <FeatureImpactBadge impact={activeRequest.impact} />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Current status</p>
                  <FeatureStatusBadge status={activeRequest.status} />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Category</p>
                  <p className="text-charcoal">{humanizeCategory(activeRequest.category)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted mb-1">Page URL</p>
                {activeRequest.page_url ? (
                  <a href={activeRequest.page_url} target="_blank" rel="noopener noreferrer" className="text-sm text-sage-700 hover:underline break-all">
                    {activeRequest.page_url}
                  </a>
                ) : (
                  <p className="text-sm text-muted">Not provided</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted mb-1">Full request</p>
                <div className="bg-sage-50 rounded-xl p-4 text-sm text-charcoal whitespace-pre-wrap">{activeRequest.description}</div>
              </div>

              <div className="pt-2">
                <label htmlFor="feature-status" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Update status
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <select
                    id="feature-status"
                    className="input flex-1"
                    value={nextStatus}
                    onChange={(event) => setNextStatus(toFeatureStatus(event.target.value))}
                    disabled={savingStatus}
                  >
                    {FEATURE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => void saveFeatureStatus()}
                    disabled={savingStatus || nextStatus === activeRequest.status}
                    className="btn-primary"
                  >
                    {savingStatus ? 'Saving...' : 'Save status'}
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
