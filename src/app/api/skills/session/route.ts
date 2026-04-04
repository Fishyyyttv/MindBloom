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

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'skills_session.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('skills_session:create', req, userId),
    limit: 100,
    windowMs: 60_000,
  })
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many writes. Please slow down for a moment.' }, { status: 429, headers })
  }

  const user = await ensureAppUser({ clerkId: userId })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  const skillType = typeof body?.skillType === 'string' ? body.skillType.trim() : ''
  if (!skillType) {
    return Response.json({ error: 'Skill type is required' }, { status: 400, headers })
  }

  const durationSeconds =
    typeof body?.durationSeconds === 'number'
      ? Math.max(0, Math.min(60 * 60, Math.round(body.durationSeconds)))
      : null

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('skill_sessions')
    .insert({
      user_id: user.id,
      skill_type: skillType.slice(0, 120),
      duration_seconds: durationSeconds,
    })
    .select()
    .single()

  if (error) {
    await logEvent({
      level: 'error',
      category: 'skills_session',
      action: 'create_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  return Response.json({ session: data }, { headers })
}
