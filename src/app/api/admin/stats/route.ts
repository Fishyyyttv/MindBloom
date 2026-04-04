import { requireAdmin } from '@/lib/admin-auth'
import { buildRateLimitHeaders, buildRateLimitKey, checkRateLimit, getRequestPath } from '@/lib/api-security'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const WORKSHEET_TABLES = ['worksheet_completions', 'worksheets_completions'] as const

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

async function fetchWorksheetRows(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  for (const tableName of WORKSHEET_TABLES) {
    const result = await supabaseAdmin.from(tableName).select('id')
    if (!result.error) return result
    if (!isMissingTableError(result.error)) return result
  }
  return { data: [], error: null }
}

async function fetchBugReports(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const result = await supabaseAdmin
    .from('bug_reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20)

  if (isMissingTableError(result.error)) {
    return { data: [], count: 0, openCount: 0, error: null }
  }

  if (result.error) {
    return {
      data: result.data ?? [],
      count: result.count ?? 0,
      openCount: 0,
      error: result.error,
    }
  }

  const openCountResult = await supabaseAdmin
    .from('bug_reports')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'resolved')

  if (isMissingTableError(openCountResult.error)) {
    return { ...result, openCount: 0 }
  }

  if (openCountResult.error) {
    return {
      data: result.data ?? [],
      count: result.count ?? 0,
      openCount: 0,
      error: openCountResult.error,
    }
  }

  return {
    data: result.data ?? [],
    count: result.count ?? 0,
    openCount: openCountResult.count ?? 0,
    error: null,
  }
}

async function fetchFeatureRequests(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const result = await supabaseAdmin
    .from('feature_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20)

  if (isMissingTableError(result.error)) {
    return { data: [], count: 0, openCount: 0, error: null }
  }

  if (result.error) {
    return {
      data: result.data ?? [],
      count: result.count ?? 0,
      openCount: 0,
      error: result.error,
    }
  }

  const openCountResult = await supabaseAdmin
    .from('feature_requests')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'under_review', 'planned', 'in_progress'])

  if (isMissingTableError(openCountResult.error)) {
    return { ...result, openCount: 0 }
  }

  if (openCountResult.error) {
    return {
      data: result.data ?? [],
      count: result.count ?? 0,
      openCount: 0,
      error: openCountResult.error,
    }
  }

  return {
    data: result.data ?? [],
    count: result.count ?? 0,
    openCount: openCountResult.count ?? 0,
    error: null,
  }
}

async function fetchDeletionRequests(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const result = await supabaseAdmin
    .from('data_deletion_requests')
    .select('*', { count: 'exact' })
    .order('requested_at', { ascending: false })
    .limit(20)

  if (isMissingTableError(result.error)) {
    return { data: [], count: 0, error: null }
  }

  return result
}

export async function GET(req: Request) {
  const admin = await requireAdmin({ action: 'admin.stats', req })
  if (!admin.ok) return admin.response

  const route = getRequestPath(req)
  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('admin:stats', req, admin.userId),
    limit: 120,
    windowMs: 60_000,
  })
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit)

  if (!rateLimit.allowed) {
    await logEvent({
      level: 'warn',
      category: 'rate_limit',
      action: 'admin.stats.blocked',
      userId: admin.userId,
      route,
    })
    return Response.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const [
      { data: users, error: usersError },
      { data: messages, error: messagesError },
      { data: diary, error: diaryError },
      { data: moods, error: moodsError },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('messages').select('id'),
      supabaseAdmin.from('diary_entries').select('id'),
      supabaseAdmin.from('mood_logs').select('score, created_at').order('created_at', { ascending: false }).limit(200),
    ])

    const { data: worksheets, error: worksheetsError } = await fetchWorksheetRows(supabaseAdmin)
    const {
      data: bugReports,
      count: bugReportTotal,
      openCount: openBugReportTotal,
      error: bugReportsError,
    } = await fetchBugReports(supabaseAdmin)
    const {
      data: featureRequests,
      count: featureRequestTotal,
      openCount: openFeatureRequestTotal,
      error: featureRequestsError,
    } = await fetchFeatureRequests(supabaseAdmin)
    const {
      data: deletionRequests,
      count: deletionRequestTotal,
      error: deletionRequestsError,
    } = await fetchDeletionRequests(supabaseAdmin)

    const firstError =
      usersError ??
      messagesError ??
      diaryError ??
      moodsError ??
      worksheetsError ??
      bugReportsError ??
      featureRequestsError ??
      deletionRequestsError

    if (firstError) {
      await logEvent({
        level: 'error',
        category: 'admin',
        action: 'stats.db_error',
        userId: admin.userId,
        route,
        metadata: { message: firstError.message, code: firstError.code },
      })
      return Response.json({ error: 'Database error' }, { status: 500, headers: rateLimitHeaders })
    }

    return Response.json(
      {
        users,
        messages,
        diary,
        moods,
        worksheets,
        bugReports,
        bugReportTotal: bugReportTotal ?? 0,
        openBugReportTotal: openBugReportTotal ?? 0,
        featureRequests,
        featureRequestTotal: featureRequestTotal ?? 0,
        openFeatureRequestTotal: openFeatureRequestTotal ?? 0,
        deletionRequests,
        deletionRequestTotal: deletionRequestTotal ?? 0,
      },
      { headers: rateLimitHeaders }
    )
  } catch (error: any) {
    await logEvent({
      level: 'error',
      category: 'admin',
      action: 'stats.exception',
      userId: admin.userId,
      route,
      metadata: { message: error?.message ?? 'unknown_error' },
    })

    return Response.json({ error: 'Internal server error' }, { status: 500, headers: rateLimitHeaders })
  }
}
