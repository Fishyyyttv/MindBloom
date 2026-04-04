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

const STATUSES = new Set(['open', 'under_review', 'planned', 'in_progress', 'shipped', 'declined'])

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
  const admin = await requireAdmin({ action: 'admin.feature_requests.update', req })
  if (!admin.ok) return admin.response

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'admin.feature_requests.update.origin_blocked',
      userId: admin.userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('admin:feature_requests:update', req, admin.userId),
    limit: 80,
    windowMs: 60_000,
  })
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit)

  if (!rateLimit.allowed) {
    await logEvent({
      level: 'warn',
      category: 'rate_limit',
      action: 'admin.feature_requests.update.blocked',
      userId: admin.userId,
      route,
    })
    return Response.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  const requestId = normalizeText(params?.id, 100)
  if (!requestId) {
    return Response.json({ error: 'Invalid request ID' }, { status: 400, headers: rateLimitHeaders })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: rateLimitHeaders })
  }

  const nextStatus = normalizeText((body as { status?: unknown })?.status, 30).toLowerCase()
  if (!STATUSES.has(nextStatus)) {
    return Response.json({ error: 'Invalid status' }, { status: 400, headers: rateLimitHeaders })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('feature_requests')
    .update({ status: nextStatus })
    .eq('id', requestId)
    .select('*')
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return Response.json(
        { error: 'feature_requests table not found. Run the Supabase SQL migration first.' },
        { status: 500, headers: rateLimitHeaders }
      )
    }

    await logEvent({
      level: 'error',
      category: 'admin',
      action: 'feature_requests.update_failed',
      userId: admin.userId,
      route,
      metadata: { message: error.message, code: error.code, requestId },
    })
    return Response.json({ error: error.message }, { status: 500, headers: rateLimitHeaders })
  }

  if (!data) {
    return Response.json({ error: 'Feature request not found' }, { status: 404, headers: rateLimitHeaders })
  }

  await logEvent({
    level: 'info',
    category: 'admin',
    action: 'feature_requests.status_updated',
    userId: admin.userId,
    route,
    metadata: { requestId, status: nextStatus },
  })

  return Response.json({ request: data }, { headers: rateLimitHeaders })
}
