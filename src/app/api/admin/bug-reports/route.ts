import { requireAdmin } from '@/lib/admin-auth'
import { buildRateLimitHeaders, buildRateLimitKey, checkRateLimit, getRequestPath } from '@/lib/api-security'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const SEVERITY_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

const STATUS_ORDER: Record<string, number> = {
  open: 1,
  triaged: 2,
  in_progress: 3,
  resolved: 4,
}

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

type SortBy = 'created_at' | 'severity' | 'status'
type SortOrder = 'asc' | 'desc'

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  if (parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
}

function parseSortBy(value: string | null): SortBy {
  if (value === 'severity' || value === 'status' || value === 'created_at') return value
  return 'created_at'
}

function parseSortOrder(value: string | null): SortOrder {
  if (value === 'asc' || value === 'desc') return value
  return 'desc'
}

function compareCreatedAt(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime()
}

export async function GET(req: Request) {
  const admin = await requireAdmin({ action: 'admin.bug_reports', req })
  if (!admin.ok) return admin.response

  const route = getRequestPath(req)
  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('admin:bug_reports', req, admin.userId),
    limit: 120,
    windowMs: 60_000,
  })
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit)

  if (!rateLimit.allowed) {
    await logEvent({
      level: 'warn',
      category: 'rate_limit',
      action: 'admin.bug_reports.blocked',
      userId: admin.userId,
      route,
    })
    return Response.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  const url = new URL(req.url)
  const page = parsePositiveInt(url.searchParams.get('page'), 1, 10_000)
  const pageSize = parsePositiveInt(url.searchParams.get('pageSize'), 20, 100)
  const sortBy = parseSortBy(url.searchParams.get('sortBy'))
  const order = parseSortOrder(url.searchParams.get('order'))
  const severityFilter = (url.searchParams.get('severity') || 'all').toLowerCase()
  const statusFilter = (url.searchParams.get('status') || 'all').toLowerCase()

  const supabaseAdmin = getSupabaseAdmin()

  const { data: rawReports, error: reportsError } = await supabaseAdmin
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (reportsError) {
    if (isMissingTableError(reportsError)) {
      return Response.json(
        {
          reports: [],
          page: 1,
          pageSize,
          total: 0,
          totalPages: 1,
        },
        { headers: rateLimitHeaders }
      )
    }

    await logEvent({
      level: 'error',
      category: 'admin',
      action: 'bug_reports.fetch_failed',
      userId: admin.userId,
      route,
      metadata: { message: reportsError.message, code: reportsError.code },
    })
    return Response.json({ error: reportsError.message }, { status: 500, headers: rateLimitHeaders })
  }

  const reports = rawReports ?? []
  const userIds = Array.from(new Set(reports.map((report) => report.user_id).filter(Boolean))) as string[]
  let userEmailById = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .in('id', userIds)

    if (usersError) {
      await logEvent({
        level: 'error',
        category: 'admin',
        action: 'bug_reports.user_lookup_failed',
        userId: admin.userId,
        route,
        metadata: { message: usersError.message, code: usersError.code },
      })
      return Response.json({ error: usersError.message }, { status: 500, headers: rateLimitHeaders })
    }

    userEmailById = new Map((users ?? []).map((user) => [user.id, user.email || 'Unknown']))
  }

  const normalized = reports
    .map((report) => ({
      ...report,
      severity: String(report.severity ?? 'medium'),
      status: String(report.status ?? 'open'),
      reporter_email: report.user_id ? userEmailById.get(report.user_id) ?? 'Unknown' : 'Unknown',
    }))
    .filter((report) => (severityFilter === 'all' ? true : report.severity === severityFilter))
    .filter((report) => (statusFilter === 'all' ? true : report.status === statusFilter))

  normalized.sort((a, b) => {
    let compare = 0

    if (sortBy === 'severity') {
      compare = (SEVERITY_ORDER[a.severity] ?? 0) - (SEVERITY_ORDER[b.severity] ?? 0)
    } else if (sortBy === 'status') {
      compare = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0)
    } else {
      compare = compareCreatedAt(a.created_at, b.created_at)
    }

    if (compare === 0) {
      compare = compareCreatedAt(a.created_at, b.created_at)
    }

    return order === 'asc' ? compare : -compare
  })

  const total = normalized.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = startIndex + pageSize

  return Response.json(
    {
      reports: normalized.slice(startIndex, endIndex),
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
    { headers: rateLimitHeaders }
  )
}
