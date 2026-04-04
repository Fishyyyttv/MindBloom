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

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

function normalizeEndpoint(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 2000)
}

function rateLimit(req: Request, userId: string) {
  return checkRateLimit({
    key: buildRateLimitKey('notifications:subscribe', req, userId),
    limit: 60,
    windowMs: 60_000,
  })
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
      action: 'notifications.subscribe.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const limit = rateLimit(req, userId)
  const headers = buildRateLimitHeaders(limit)
  if (!limit.allowed) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  const subscription = body?.subscription
  const endpoint = normalizeEndpoint(subscription?.endpoint)
  const p256dh = normalizeEndpoint(subscription?.keys?.p256dh)
  const authKey = normalizeEndpoint(subscription?.keys?.auth)

  if (!endpoint || !p256dh || !authKey) {
    return Response.json({ error: 'Invalid subscription payload' }, { status: 400, headers })
  }

  const clerkUser = await currentUser()
  const appUser = await ensureAppUser({
    clerkId: userId,
    email: clerkUser?.emailAddresses?.[0]?.emailAddress,
  })
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin.from('push_subscriptions').upsert(
    {
      user_id: appUser.id,
      endpoint,
      p256dh_key: p256dh,
      auth_key: authKey,
      user_agent: normalizeEndpoint(body?.userAgent || req.headers.get('user-agent')),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    if (isMissingTableError(error)) {
      return Response.json(
        { error: 'push_subscriptions table not found. Run the Supabase SQL migration first.' },
        { status: 500, headers }
      )
    }

    await logEvent({
      level: 'error',
      category: 'notifications',
      action: 'subscribe_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  await supabaseAdmin.from('notification_preferences').upsert(
    {
      user_id: appUser.id,
      push_enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  await logEvent({
    level: 'info',
    category: 'notifications',
    action: 'subscribed',
    userId,
    route,
    metadata: { endpointHash: endpoint.slice(0, 80) },
  })

  return Response.json({ success: true }, { headers })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'notifications.unsubscribe.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const limit = rateLimit(req, userId)
  const headers = buildRateLimitHeaders(limit)
  if (!limit.allowed) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // Optional JSON.
  }

  const endpoint = normalizeEndpoint(body?.endpoint)
  const appUser = await ensureAppUser({ clerkId: userId })
  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin.from('push_subscriptions').delete().eq('user_id', appUser.id)
  if (endpoint) {
    query = query.eq('endpoint', endpoint)
  }

  const { error } = await query
  if (error && !isMissingTableError(error)) {
    await logEvent({
      level: 'error',
      category: 'notifications',
      action: 'unsubscribe_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  const { data: remaining, error: remainingError } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', appUser.id)
    .limit(1)

  if (!remainingError) {
    await supabaseAdmin.from('notification_preferences').upsert(
      {
        user_id: appUser.id,
        push_enabled: (remaining ?? []).length > 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }

  await logEvent({
    level: 'info',
    category: 'notifications',
    action: 'unsubscribed',
    userId,
    route,
  })

  return Response.json({ success: true }, { headers })
}
