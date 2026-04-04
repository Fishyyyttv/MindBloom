import { auth } from '@clerk/nextjs/server'
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

function readRateLimit(req: Request, userId: string) {
  return checkRateLimit({
    key: buildRateLimitKey('mood:list', req, userId),
    limit: 120,
    windowMs: 60_000,
  })
}

function writeRateLimit(req: Request, userId: string) {
  return checkRateLimit({
    key: buildRateLimitKey('mood:write', req, userId),
    limit: 80,
    windowMs: 60_000,
  })
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = readRateLimit(req, userId)
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const user = await ensureAppUser({ clerkId: userId })

  const { data, error } = await supabaseAdmin
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    await logEvent({
      level: 'error',
      category: 'mood',
      action: 'list_failed',
      userId,
      route: getRequestPath(req),
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  return Response.json({ logs: data ?? [] }, { headers })
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
      action: 'mood.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = writeRateLimit(req, userId)
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many writes. Please slow down for a moment.' }, { status: 429, headers })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const user = await ensureAppUser({ clerkId: userId })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  if (typeof body?.score !== 'number' || body.score < 1 || body.score > 10) {
    return Response.json({ error: 'Score must be between 1 and 10' }, { status: 400, headers })
  }

  const emotions = Array.isArray(body.emotions)
    ? body.emotions.filter((emotion: unknown) => typeof emotion === 'string').slice(0, 8)
    : []

  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 600) : null

  const { data, error } = await supabaseAdmin
    .from('mood_logs')
    .insert({
      user_id: user.id,
      score: body.score,
      emotions,
      note: note || null,
    })
    .select()
    .single()

  if (error) {
    await logEvent({
      level: 'error',
      category: 'mood',
      action: 'create_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  return Response.json({ log: data }, { headers })
}
