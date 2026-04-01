'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import {
  Users, DollarSign, MessageCircle, BookOpen,
  TrendingUp, Activity, Shield, RefreshCw, Heart
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

const ADMIN_USER_ID = 'user_3Bk4ej2PiqeNmdL7Y9obghgEAXt'

interface Stats {
  totalUsers: number
  activeSubscriptions: number
  trialUsers: number
  canceledUsers: number
  totalMessages: number
  totalDiaryEntries: number
  totalMoodLogs: number
  totalWorksheets: number
  recentUsers: Array<{ clerk_id: string; email: string; subscription_status: string; created_at: string }>
  moodByDay: Array<{ day: string; avg: number; count: number }>
  signupsByDay: Array<{ day: string; count: number }>
}

function StatCard({ label, value, icon: Icon, sub, color = 'text-sage-600', bg = 'bg-sage-50' }: {
  label: string; value: string | number; icon: React.ElementType; sub?: string; color?: string; bg?: string
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
    active:   'bg-green-50 text-green-700 border-green-200',
    trialing: 'bg-blue-50 text-blue-700 border-blue-200',
    canceled: 'bg-red-50 text-red-700 border-red-200',
    past_due: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return <span className={cn('badge border text-xs', map[status] ?? 'bg-gray-50 text-gray-600 border-gray-200')}>{status ?? 'unknown'}</span>
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function AdminPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const isAdmin = isLoaded && user?.id === ADMIN_USER_ID

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.replace('/'); return }
    loadStats()
  }, [isLoaded, isAdmin])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const { users, messages, diary, moods, worksheets } = await res.json()

      const allUsers: any[] = users ?? []
      const days = getLast7Days()

      setStats({
        totalUsers: allUsers.length,
        activeSubscriptions: allUsers.filter((u: any) => u.subscription_status === 'active').length,
        trialUsers: allUsers.filter((u: any) => u.subscription_status === 'trialing').length,
        canceledUsers: allUsers.filter((u: any) => u.subscription_status === 'canceled').length,
        totalMessages: messages?.length ?? 0,
        totalDiaryEntries: diary?.length ?? 0,
        totalMoodLogs: moods?.length ?? 0,
        totalWorksheets: worksheets?.length ?? 0,
        recentUsers: allUsers.slice(0, 10),
        signupsByDay: days.map(day => ({ day, count: allUsers.filter((u: any) => u.created_at?.startsWith(day)).length })),
        moodByDay: days.map(day => {
          const dayMoods = (moods ?? []).filter((m: any) => m.created_at?.startsWith(day))
          return {
            day,
            count: dayMoods.length,
            avg: dayMoods.length > 0
              ? Math.round((dayMoods.reduce((s: number, m: any) => s + m.score, 0) / dayMoods.length) * 10) / 10
              : 0
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

  if (!isLoaded || !isAdmin) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-muted text-sm">Checking access...</p>
    </div>
  )

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
          <button onClick={loadStats} disabled={loading} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
          </button>
          <a href="/app/chat" className="btn-secondary text-sm py-2">← App</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading && !stats ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex gap-2">{[0,1,2].map(i => <span key={i} className="w-2.5 h-2.5 bg-sage-300 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
          </div>
        ) : stats ? (<>

          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Revenue</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="MRR" value={`$${mrr}`} icon={DollarSign} sub="active subscribers" color="text-green-600" bg="bg-green-50" />
              <StatCard label="Projected MRR" value={`$${projectedMrr}`} icon={TrendingUp} sub="incl. trials converting" color="text-green-600" bg="bg-green-50" />
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

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-charcoal mb-1">New signups</h3>
              <p className="text-xs text-muted mb-5">Last 7 days</p>
              <div className="flex items-end gap-2 h-32">
                {stats.signupsByDay.map((d, i) => {
                  const max = Math.max(...stats.signupsByDay.map(x => x.count), 1)
                  const pct = (d.count / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-charcoal">{d.count || ''}</span>
                      <div className="w-full rounded-t-lg bg-sage-400 transition-all" style={{ height: `${Math.max(pct, d.count > 0 ? 10 : 3)}%`, opacity: d.count > 0 ? 1 : 0.15 }} />
                      <span className="text-xs text-muted">{d.day.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-charcoal mb-1">Avg mood score</h3>
              <p className="text-xs text-muted mb-5">Last 7 days (1–10)</p>
              <div className="flex items-end gap-2 h-32">
                {stats.moodByDay.map((d, i) => {
                  const pct = (d.avg / 10) * 100
                  const color = d.avg >= 7 ? 'bg-green-400' : d.avg >= 5 ? 'bg-yellow-400' : d.avg > 0 ? 'bg-red-400' : 'bg-sage-100'
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-charcoal">{d.avg > 0 ? d.avg : ''}</span>
                      <div className={`w-full rounded-t-lg ${color} transition-all`} style={{ height: `${Math.max(pct, d.avg > 0 ? 10 : 3)}%`, opacity: d.avg > 0 ? 1 : 0.15 }} />
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
                { label: 'Active',          count: stats.activeSubscriptions, color: 'bg-green-400' },
                { label: 'Trialing',        count: stats.trialUsers,          color: 'bg-blue-400'  },
                { label: 'Canceled',        count: stats.canceledUsers,       color: 'bg-red-400'   },
                { label: 'No subscription', count: stats.totalUsers - stats.activeSubscriptions - stats.trialUsers - stats.canceledUsers, color: 'bg-gray-200' },
              ].map(row => {
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
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-muted text-sm">No users yet</td></tr>
                  ) : stats.recentUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-sage-50/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-charcoal">{u.email}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={u.subscription_status} /></td>
                      <td className="px-6 py-3.5 text-muted">{formatDate(u.created_at)}</td>
                      <td className="px-6 py-3.5 text-muted font-mono text-xs">{u.clerk_id?.slice(0, 18)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Quick links</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Stripe Dashboard',  href: 'https://dashboard.stripe.com',   desc: 'Payments, invoices, disputes' },
                { label: 'Supabase Dashboard',href: 'https://supabase.com/dashboard',  desc: 'Database, logs, RLS'         },
                { label: 'Clerk Dashboard',   href: 'https://dashboard.clerk.com',     desc: 'Users, sessions, auth'       },
                { label: 'Groq Console',      href: 'https://console.groq.com',        desc: 'AI usage & rate limits'      },
                { label: 'Vercel Dashboard',  href: 'https://vercel.com/dashboard',    desc: 'Deploys, logs, analytics'    },
                { label: '988 Lifeline',      href: 'https://988lifeline.org',         desc: 'Crisis resource reference'   },
              ].map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="card p-4 hover:shadow-card-hover hover:border-sage-200 transition-all group">
                  <div className="font-medium text-charcoal text-sm group-hover:text-sage-700 transition-colors">{link.label} →</div>
                  <div className="text-xs text-muted mt-0.5">{link.desc}</div>
                </a>
              ))}
            </div>
          </div>

        </>) : null}
      </div>
    </div>
  )
}