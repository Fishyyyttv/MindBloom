'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  DollarSign,
  MessageCircle,
  BookOpen,
  TrendingUp,
  Activity,
  Shield,
  RefreshCw,
  Heart,
  Bug,
  Lightbulb,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, cn } from '@/lib/utils'

type BugStatus = 'open' | 'triaged' | 'in_progress' | 'resolved'

const BUG_STATUS_OPTIONS: Array<{ value: BugStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved (fixed)' },
]

const BUG_STATUS_SET = new Set<BugStatus>(['open', 'triaged', 'in_progress', 'resolved'])

function toBugStatus(value: unknown): BugStatus {
  if (typeof value === 'string' && BUG_STATUS_SET.has(value as BugStatus)) {
    return value as BugStatus
  }
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

interface FeatureRequest {
  id: string
  user_id: string | null
  requester_email: string
  title: string
  description: string
  impact: string
  category: string
  status: string
  page_url: string | null
  created_at: string
  updated_at: string | null
}

interface Stats {
  totalUsers: number
  activeSubscriptions: number
  trialUsers: number
  canceledUsers: number
  totalMessages: number
  totalDiaryEntries: number
  totalMoodLogs: number
  totalWorksheets: number
  openBugReports: number
  bugReportTotal: number
  openFeatureRequests: number
  featureRequestTotal: number
  deletionRequestTotal: number
  recentUsers: Array<{ clerk_id: string; email: string; subscription_status: string; created_at: string }>
  bugReports: BugReport[]
  featureRequests: FeatureRequest[]
  deletionRequests: Array<{
    id: string
    clerk_id: string | null
    email_snapshot: string | null
    status: string
    requested_at: string
    completed_at: string | null
    failure_reason: string | null
  }>
  moodByDay: Array<{ day: string; avg: number; count: number }>
  signupsByDay: Array<{ day: string; count: number }>
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color = 'text-sage-600',
  bg = 'bg-sage-50',
}: {
  label: string
  value: string | number
  icon: React.ElementType
  sub?: string
  color?: string
  bg?: string
}) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-3xl font-serif font-medium text-charcoal mb-0.5">{value}</div>
      <div className="text-sm font-medium text-charcoal">{label}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border-green-200',
    trialing: 'bg-blue-50 text-blue-700 border-blue-200',
    canceled: 'bg-red-50 text-red-700 border-red-200',
    past_due: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return <span className={cn('badge border text-xs', map[status] ?? 'bg-gray-50 text-gray-600 border-gray-200')}>{status ?? 'unknown'}</span>
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

function FeatureImpactBadge({ impact }: { impact: string }) {
  const map: Record<string, string> = {
    nice_to_have: 'bg-blue-50 text-blue-700 border-blue-200',
    helpful: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    high_impact: 'bg-orange-50 text-orange-700 border-orange-200',
    game_changer: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return <span className={cn('badge border text-xs', map[impact] ?? 'bg-gray-50 text-gray-600 border-gray-200')}>{impact}</span>
}

function humanizeFeatureCategory(category: string): string {
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

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [accessDenied, setAccessDenied] = useState(false)

  const [activeBugReportId, setActiveBugReportId] = useState<string | null>(null)
  const [nextBugStatus, setNextBugStatus] = useState<BugStatus>('open')
  const [savingBugStatus, setSavingBugStatus] = useState(false)

  useEffect(() => {
    void loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!activeBugReportId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveBugReportId(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeBugReportId])

  const activeBugReport = useMemo(() => {
    if (!stats || !activeBugReportId) return null
    return stats.bugReports.find((report) => report.id === activeBugReportId) ?? null
  }, [stats, activeBugReportId])

  useEffect(() => {
    if (activeBugReport) {
      setNextBugStatus(activeBugReport.status)
    }
  }, [activeBugReport])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true)
        router.replace('/')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch stats')
      const {
        users,
        messages,
        diary,
        moods,
        worksheets,
        bugReports,
        bugReportTotal,
        openBugReportTotal,
        featureRequests,
        featureRequestTotal,
        openFeatureRequestTotal,
        deletionRequests,
        deletionRequestTotal,
      } = await res.json()

      const allUsers: any[] = users ?? []
      const allBugReports: any[] = bugReports ?? []
      const allFeatureRequests: any[] = featureRequests ?? []
      const userEmailById = new Map(allUsers.map((u: any) => [u.id, u.email || 'Unknown']))
      const days = getLast7Days()

      const mappedBugReports: BugReport[] = allBugReports.slice(0, 20).map((report: any) => ({
        id: String(report.id),
        user_id: report.user_id ? String(report.user_id) : null,
        reporter_email: report.user_id ? (userEmailById.get(report.user_id) ?? 'Unknown') : 'Unknown',
        title: String(report.title ?? 'Untitled bug'),
        description: String(report.description ?? ''),
        severity: String(report.severity ?? 'medium'),
        status: toBugStatus(report.status),
        page_url: report.page_url ? String(report.page_url) : null,
        created_at: String(report.created_at),
        updated_at: report.updated_at ? String(report.updated_at) : null,
      }))

      const mappedDeletionRequests = (deletionRequests ?? []).map((item: any) => ({
        id: String(item.id),
        clerk_id: item.clerk_id ? String(item.clerk_id) : null,
        email_snapshot: item.email_snapshot ? String(item.email_snapshot) : null,
        status: String(item.status ?? 'unknown'),
        requested_at: String(item.requested_at ?? item.created_at ?? ''),
        completed_at: item.completed_at ? String(item.completed_at) : null,
        failure_reason: item.failure_reason ? String(item.failure_reason) : null,
      }))

      const mappedFeatureRequests: FeatureRequest[] = allFeatureRequests.slice(0, 20).map((item: any) => ({
        id: String(item.id),
        user_id: item.user_id ? String(item.user_id) : null,
        requester_email: item.user_id ? (userEmailById.get(item.user_id) ?? 'Unknown') : 'Unknown',
        title: String(item.title ?? 'Untitled request'),
        description: String(item.description ?? ''),
        impact: String(item.impact ?? 'helpful'),
        category: String(item.category ?? 'other'),
        status: String(item.status ?? 'open'),
        page_url: item.page_url ? String(item.page_url) : null,
        created_at: String(item.created_at),
        updated_at: item.updated_at ? String(item.updated_at) : null,
      }))

      setStats({
        totalUsers: allUsers.length,
        activeSubscriptions: allUsers.filter((u: any) => u.subscription_status === 'active').length,
        trialUsers: allUsers.filter((u: any) => u.subscription_status === 'trialing').length,
        canceledUsers: allUsers.filter((u: any) => u.subscription_status === 'canceled').length,
        totalMessages: messages?.length ?? 0,
        totalDiaryEntries: diary?.length ?? 0,
        totalMoodLogs: moods?.length ?? 0,
        totalWorksheets: worksheets?.length ?? 0,
        bugReportTotal: Number(bugReportTotal ?? mappedBugReports.length),
        featureRequestTotal: Number(featureRequestTotal ?? mappedFeatureRequests.length),
        deletionRequestTotal: Number(deletionRequestTotal ?? mappedDeletionRequests.length),
        openBugReports: Number(openBugReportTotal ?? mappedBugReports.filter((report) => report.status !== 'resolved').length),
        openFeatureRequests: Number(openFeatureRequestTotal ?? mappedFeatureRequests.filter((item) => !['shipped', 'declined'].includes(item.status)).length),
        recentUsers: allUsers.slice(0, 10),
        bugReports: mappedBugReports,
        featureRequests: mappedFeatureRequests,
        deletionRequests: mappedDeletionRequests,
        signupsByDay: days.map((day) => ({ day, count: allUsers.filter((u: any) => u.created_at?.startsWith(day)).length })),
        moodByDay: days.map((day) => {
          const dayMoods = (moods ?? []).filter((m: any) => m.created_at?.startsWith(day))
          return {
            day,
            count: dayMoods.length,
            avg:
              dayMoods.length > 0
                ? Math.round((dayMoods.reduce((s: number, m: any) => s + m.score, 0) / dayMoods.length) * 10) / 10
                : 0,
          }
        }),
      })

      setLastRefresh(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openBugReport = (report: BugReport) => {
    setActiveBugReportId(report.id)
    setNextBugStatus(report.status)
  }

  const closeBugReport = () => {
    setActiveBugReportId(null)
    setSavingBugStatus(false)
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
      const wasOpen = activeBugReport.status !== 'resolved'
      const isOpen = updatedStatus !== 'resolved'

      setStats((prev) => {
        if (!prev) return prev
        const bugReports = prev.bugReports.map((report) => {
          if (report.id !== activeBugReport.id) return report
          return {
            ...report,
            status: updatedStatus,
            updated_at: updatedUpdatedAt,
          }
        })
        return {
          ...prev,
          bugReports,
          openBugReports: prev.openBugReports + (wasOpen === isOpen ? 0 : isOpen ? 1 : -1),
        }
      })

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

  const mrr = stats ? (stats.activeSubscriptions * 9.99).toFixed(2) : '0.00'
  const projectedMrr = stats ? ((stats.activeSubscriptions + stats.trialUsers) * 9.99).toFixed(2) : '0.00'

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-sage-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sage-400 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif text-lg text-charcoal">MindBloom</span>
          <span className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted hidden sm:block">Refreshed {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={() => void loadStats()} disabled={loading} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
          </button>
          <a href="/app/chat" className="btn-secondary text-sm py-2">
            {'<-'} App
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading && !stats ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 bg-sage-300 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : stats ? (
          <>
            <div>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Revenue</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="MRR" value={`$${mrr}`} icon={DollarSign} sub="active subscribers" color="text-green-600" bg="bg-green-50" />
                <StatCard
                  label="Projected MRR"
                  value={`$${projectedMrr}`}
                  icon={TrendingUp}
                  sub="incl. trials converting"
                  color="text-green-600"
                  bg="bg-green-50"
                />
                <StatCard label="Active" value={stats.activeSubscriptions} icon={Activity} sub="paying $9.99/mo" color="text-green-600" bg="bg-green-50" />
                <StatCard label="In trial" value={stats.trialUsers} icon={Shield} sub="7-day free trial" color="text-blue-600" bg="bg-blue-50" />
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Users & Engagement</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total users" value={stats.totalUsers} icon={Users} sub="all time" />
                <StatCard label="AI messages" value={stats.totalMessages} icon={MessageCircle} sub="total sent" color="text-purple-600" bg="bg-purple-50" />
                <StatCard label="Journal entries" value={stats.totalDiaryEntries} icon={BookOpen} sub="written" color="text-pink-500" bg="bg-pink-50" />
                <StatCard label="Mood logs" value={stats.totalMoodLogs} icon={Activity} sub="check-ins" color="text-yellow-600" bg="bg-yellow-50" />
              </div>
            </div>

          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Quality</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <StatCard label="Open bug reports" value={stats.openBugReports} icon={Bug} sub="needs triage/fix" color="text-red-600" bg="bg-red-50" />
              <StatCard label="Total bug reports" value={stats.bugReportTotal} icon={Bug} sub="all reports" color="text-rose-600" bg="bg-rose-50" />
              <StatCard label="Open feature requests" value={stats.openFeatureRequests} icon={Lightbulb} sub="needs product review" color="text-amber-600" bg="bg-amber-50" />
              <StatCard label="Total feature requests" value={stats.featureRequestTotal} icon={Lightbulb} sub="all ideas" color="text-purple-600" bg="bg-purple-50" />
              <StatCard label="Worksheets saved" value={stats.totalWorksheets} icon={BookOpen} sub="tracked completions" color="text-indigo-600" bg="bg-indigo-50" />
              <StatCard label="Data deletion requests" value={stats.deletionRequestTotal} icon={Shield} sub="GDPR/CCPA requests" color="text-gray-700" bg="bg-gray-100" />
            </div>
          </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-semibold text-charcoal mb-1">New signups</h3>
                <p className="text-xs text-muted mb-5">Last 7 days</p>
                <div className="flex items-end gap-2 h-32">
                  {stats.signupsByDay.map((d, i) => {
                    const max = Math.max(...stats.signupsByDay.map((x) => x.count), 1)
                    const pct = (d.count / max) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-charcoal">{d.count || ''}</span>
                        <div
                          className="w-full rounded-t-lg bg-sage-400 transition-all"
                          style={{ height: `${Math.max(pct, d.count > 0 ? 10 : 3)}%`, opacity: d.count > 0 ? 1 : 0.15 }}
                        />
                        <span className="text-xs text-muted">{d.day.slice(5)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold text-charcoal mb-1">Avg mood score</h3>
                <p className="text-xs text-muted mb-5">Last 7 days (1-10)</p>
                <div className="flex items-end gap-2 h-32">
                  {stats.moodByDay.map((d, i) => {
                    const pct = (d.avg / 10) * 100
                    const color = d.avg >= 7 ? 'bg-green-400' : d.avg >= 5 ? 'bg-yellow-400' : d.avg > 0 ? 'bg-red-400' : 'bg-sage-100'
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-charcoal">{d.avg > 0 ? d.avg : ''}</span>
                        <div
                          className={`w-full rounded-t-lg ${color} transition-all`}
                          style={{ height: `${Math.max(pct, d.avg > 0 ? 10 : 3)}%`, opacity: d.avg > 0 ? 1 : 0.15 }}
                        />
                        <span className="text-xs text-muted">{d.day.slice(5)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-charcoal mb-4">Subscription breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Active', count: stats.activeSubscriptions, color: 'bg-green-400' },
                  { label: 'Trialing', count: stats.trialUsers, color: 'bg-blue-400' },
                  { label: 'Canceled', count: stats.canceledUsers, color: 'bg-red-400' },
                  {
                    label: 'No subscription',
                    count: stats.totalUsers - stats.activeSubscriptions - stats.trialUsers - stats.canceledUsers,
                    color: 'bg-gray-200',
                  },
                ].map((row) => {
                  const pct = stats.totalUsers > 0 ? (row.count / stats.totalUsers) * 100 : 0
                  return (
                    <div key={row.label} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-muted shrink-0">{row.label}</div>
                      <div className="flex-1 bg-sage-50 rounded-full h-2">
                        <div className={`${row.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-8 text-sm font-medium text-charcoal text-right">{row.count}</div>
                      <div className="w-10 text-xs text-muted text-right">{pct.toFixed(0)}%</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-sage-100">
                <h3 className="font-semibold text-charcoal">Recent signups</h3>
                <p className="text-xs text-muted">Last 10 users</p>
              </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 bg-sage-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Signed up</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Clerk ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-50">
                    {stats.recentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-muted text-sm">
                          No users yet
                        </td>
                      </tr>
                    ) : (
                      stats.recentUsers.map((u, i) => (
                        <tr key={i} className="hover:bg-sage-50/40 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-charcoal">{u.email}</td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status={u.subscription_status} />
                          </td>
                          <td className="px-6 py-3.5 text-muted">{formatDate(u.created_at)}</td>
                          <td className="px-6 py-3.5 text-muted font-mono text-xs">{u.clerk_id?.slice(0, 18)}...</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-sage-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-charcoal">Bug reports</h3>
                  <p className="text-xs text-muted">Showing latest 20. Click a title for details and status updates.</p>
                </div>
                <Link href="/app/admin/bugs" className="btn-secondary text-xs py-2 px-3 shrink-0">
                  View all + sort
                </Link>
              </div>
            </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 bg-sage-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Title</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Reporter</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Severity</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Page</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-50">
                    {stats.bugReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-muted text-sm">
                          No bug reports yet
                        </td>
                      </tr>
                    ) : (
                      stats.bugReports.map((report) => (
                        <tr key={report.id} className="hover:bg-sage-50/40 transition-colors align-top">
                          <td className="px-6 py-3.5">
                            <button
                              type="button"
                              onClick={() => openBugReport(report)}
                              className="font-medium text-charcoal hover:underline text-left"
                            >
                              {report.title}
                            </button>
                            <div className="text-xs text-muted mt-1 max-w-md whitespace-pre-wrap line-clamp-2">{report.description}</div>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted">{report.reporter_email}</td>
                          <td className="px-6 py-3.5">
                            <BugSeverityBadge severity={report.severity} />
                          </td>
                          <td className="px-6 py-3.5">
                            <BugStatusBadge status={report.status} />
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted max-w-[260px] truncate">
                            {report.page_url ? (
                              <a href={report.page_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {report.page_url}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-muted">{formatDate(report.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-sage-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-charcoal">Feature requests</h3>
                    <p className="text-xs text-muted">Showing latest 20 product ideas. Use "View all" to triage and update status.</p>
                  </div>
                  <Link href="/app/admin/features" className="btn-secondary text-xs py-2 px-3 shrink-0">
                    View all + sort
                  </Link>
                </div>
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
                    {stats.featureRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-muted text-sm">
                          No feature requests yet
                        </td>
                      </tr>
                    ) : (
                      stats.featureRequests.map((item) => (
                        <tr key={item.id} className="hover:bg-sage-50/40 transition-colors align-top">
                          <td className="px-6 py-3.5">
                            <div className="font-medium text-charcoal">{item.title}</div>
                            <div className="text-xs text-muted mt-1 max-w-md whitespace-pre-wrap line-clamp-2">{item.description}</div>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted">{item.requester_email}</td>
                          <td className="px-6 py-3.5">
                            <FeatureImpactBadge impact={item.impact} />
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted">{humanizeFeatureCategory(item.category)}</td>
                          <td className="px-6 py-3.5 text-xs text-muted">{item.status}</td>
                          <td className="px-6 py-3.5 text-muted">{formatDate(item.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-sage-100">
                <h3 className="font-semibold text-charcoal">Data deletion requests</h3>
                <p className="text-xs text-muted">Latest GDPR/CCPA requests</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 bg-sage-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Email snapshot</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Requested</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Completed</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-50">
                    {stats.deletionRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-muted text-sm">
                          No deletion requests yet
                        </td>
                      </tr>
                    ) : (
                      stats.deletionRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-sage-50/40 transition-colors align-top">
                          <td className="px-6 py-3.5 text-xs text-muted">{request.email_snapshot ?? request.clerk_id ?? 'Unknown'}</td>
                          <td className="px-6 py-3.5 text-xs">
                            <span
                              className={cn(
                                'badge border text-xs',
                                request.status === 'completed'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : request.status === 'failed'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              )}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-muted">{request.requested_at ? formatDate(request.requested_at) : '-'}</td>
                          <td className="px-6 py-3.5 text-muted">{request.completed_at ? formatDate(request.completed_at) : '-'}</td>
                          <td className="px-6 py-3.5 text-xs text-muted max-w-xs whitespace-pre-wrap">{request.failure_reason ?? '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Quick links</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Stripe Dashboard', href: 'https://dashboard.stripe.com', desc: 'Payments, invoices, disputes' },
                  { label: 'Supabase Dashboard', href: 'https://supabase.com/dashboard', desc: 'Database, logs, RLS' },
                  { label: 'Clerk Dashboard', href: 'https://dashboard.clerk.com', desc: 'Users, sessions, auth' },
                  { label: 'Groq Console', href: 'https://console.groq.com', desc: 'AI usage & rate limits' },
                  { label: 'Vercel Dashboard', href: 'https://vercel.com/dashboard', desc: 'Deploys, logs, analytics' },
                  { label: '988 Lifeline', href: 'https://988lifeline.org', desc: 'Crisis resource reference' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card p-4 hover:shadow-card-hover hover:border-sage-200 transition-all group"
                  >
                    <div className="font-medium text-charcoal text-sm group-hover:text-sage-700 transition-colors">{link.label} {'->'}</div>
                    <div className="text-xs text-muted mt-0.5">{link.desc}</div>
                  </a>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {activeBugReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/50"
            onClick={closeBugReport}
            aria-label="Close bug report details"
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-sage-100 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-sage-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Bug report</p>
                <h3 className="text-lg font-semibold text-charcoal mt-1">{activeBugReport.title}</h3>
              </div>
              <button type="button" onClick={closeBugReport} className="btn-ghost px-2 py-2" aria-label="Close panel">
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
