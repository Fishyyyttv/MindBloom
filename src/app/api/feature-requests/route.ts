import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import {
  buildRateLimitHeaders,
  buildRateLimitKey,
  checkRateLimit,
  getRequestPath,
  validateMutationOrigin,
} from '@/lib/api-security'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ensureAppUser } from '@/lib/server-user'

const IMPACTS = new Set(['nice_to_have', 'helpful', 'high_impact', 'game_changer'])
const CATEGORIES = new Set(['ai', 'wellness_tools', 'journal', 'mood', 'design', 'integrations', 'other'])

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const route = getRequestPath(req)
  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('feature_requests:list', req, userId),
    limit: 120,
    windowMs: 60_000,
  })
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit)

  if (!rateLimit.allowed) {
    return Response.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  const user = await ensureAppUser({ clerkId: userId })
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('feature_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    if (isMissingTableError(error)) {
      return Response.json(
        { error: 'feature_requests table not found. Run the Supabase SQL migration first.' },
        { status: 500, headers: rateLimitHeaders }
      )
    }

    await logEvent({
      level: 'error',
      category: 'feature_requests',
      action: 'list_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers: rateLimitHeaders })
  }

  return Response.json({ requests: data ?? [] }, { headers: rateLimitHeaders })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'feature_requests.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('feature_requests:create', req, userId),
    limit: 12,
    windowMs: 10 * 60_000,
  })
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit)

  if (!rateLimit.allowed) {
    await logEvent({
      level: 'warn',
      category: 'rate_limit',
      action: 'feature_requests.create_blocked',
      userId,
      route,
    })
    return Response.json(
      { error: 'Too many submissions. Please wait a few minutes and try again.' },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: rateLimitHeaders })
  }

  const title = normalizeText(body?.title, 160)
  const description = normalizeText(body?.description, 6000)
  const impact = normalizeText(body?.impact, 30).toLowerCase()
  const category = normalizeText(body?.category, 40).toLowerCase()
  const pageUrl = normalizeText(body?.pageUrl, 500) || null
  const userAgent = normalizeText(body?.userAgent, 500) || null

  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400, headers: rateLimitHeaders })
  }
  if (!description) {
    return Response.json({ error: 'Description is required' }, { status: 400, headers: rateLimitHeaders })
  }
  if (!IMPACTS.has(impact)) {
    return Response.json({ error: 'Invalid impact' }, { status: 400, headers: rateLimitHeaders })
  }
  if (!CATEGORIES.has(category)) {
    return Response.json({ error: 'Invalid category' }, { status: 400, headers: rateLimitHeaders })
  }

  const clerkUser = await currentUser()
  const appUser = await ensureAppUser({
    clerkId: userId,
    email: clerkUser?.emailAddresses?.[0]?.emailAddress,
  })
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('feature_requests')
    .insert({
      user_id: appUser.id,
      title,
      description,
      impact,
      category,
      status: 'open',
      page_url: pageUrl,
      user_agent: userAgent,
    })
    .select()
    .single()

  if (error) {
    if (isMissingTableError(error)) {
      return Response.json(
        { error: 'feature_requests table not found. Run the Supabase SQL migration first.' },
        { status: 500, headers: rateLimitHeaders }
      )
    }

    await logEvent({
      level: 'error',
      category: 'feature_requests',
      action: 'create_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers: rateLimitHeaders })
  }

  await logEvent({
    level: 'info',
    category: 'feature_requests',
    action: 'created',
    userId,
    route,
    metadata: { impact, category, requestId: data?.id ?? null },
  })

  return Response.json({ request: data }, { headers: rateLimitHeaders })
}
