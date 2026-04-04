import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  buildRateLimitHeaders,
  buildRateLimitKey,
  checkRateLimit,
  getRequestPath,
  validateMutationOrigin,
} from '@/lib/api-security'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const STATUSES = new Set(['open', 'triaged', 'in_progress', 'resolved'])

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

interface RouteContext {
  params: { id: string }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin({ action: 'admin.bug_reports.update', req })
  if (!admin.ok) return admin.response

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'admin.bug_reports.update.origin_blocked',
      userId: admin.userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('admin:bug_reports:update', req, admin.userId),
    limit: 80,
    windowMs: 60_000,
  })
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit)

  if (!rateLimit.allowed) {
    await logEvent({
      level: 'warn',
      category: 'rate_limit',
      action: 'admin.bug_reports.update.blocked',
      userId: admin.userId,
      route,
    })
    return Response.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  const reportId = normalizeText(params?.id, 100)
  if (!reportId) {
    return Response.json({ error: 'Invalid report ID' }, { status: 400, headers: rateLimitHeaders })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: rateLimitHeaders })
  }

  const nextStatus = normalizeText((body as { status?: unknown })?.status, 20).toLowerCase()
  if (!STATUSES.has(nextStatus)) {
    return Response.json({ error: 'Invalid status' }, { status: 400, headers: rateLimitHeaders })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('bug_reports')
    .update({ status: nextStatus })
    .eq('id', reportId)
    .select('*')
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return Response.json(
        { error: 'bug_reports table not found. Run the Supabase SQL migration first.' },
        { status: 500, headers: rateLimitHeaders }
      )
    }

    await logEvent({
      level: 'error',
      category: 'admin',
      action: 'bug_reports.update_failed',
      userId: admin.userId,
      route,
      metadata: { message: error.message, code: error.code, reportId },
    })
    return Response.json({ error: error.message }, { status: 500, headers: rateLimitHeaders })
  }

  if (!data) {
    return Response.json({ error: 'Bug report not found' }, { status: 404, headers: rateLimitHeaders })
  }

  await logEvent({
    level: 'info',
    category: 'admin',
    action: 'bug_reports.status_updated',
    userId: admin.userId,
    route,
    metadata: { reportId, status: nextStatus },
  })

  return Response.json({ report: data }, { headers: rateLimitHeaders })
}
