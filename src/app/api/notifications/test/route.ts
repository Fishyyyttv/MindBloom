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
import { isWebPushConfigured, sendWebPush } from '@/lib/web-push'

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

function isGonePushError(error: any): boolean {
  return error?.statusCode === 404 || error?.statusCode === 410
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
      action: 'notifications.test.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('notifications:test', req, userId),
    limit: 12,
    windowMs: 10 * 60_000,
  })
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json(
      { error: 'Too many test notifications. Please wait a little and try again.' },
      { status: 429, headers }
    )
  }

  if (!isWebPushConfigured()) {
    return Response.json({ error: 'Push notifications are not configured on the server yet.' }, { status: 500, headers })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // Optional JSON
  }

  const appUser = await ensureAppUser({ clerkId: userId })
  const supabaseAdmin = getSupabaseAdmin()

  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh_key, auth_key')
    .eq('user_id', appUser.id)

  if (error) {
    if (isMissingTableError(error)) {
      return Response.json(
        { error: 'push_subscriptions table not found. Run the Supabase SQL migration first.' },
        { status: 500, headers }
      )
    }
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return Response.json({ error: 'No push-enabled devices found for this account.' }, { status: 400, headers })
  }

  const payload = {
    title: 'MindBloom check-in',
    body:
      typeof body?.message === 'string' && body.message.trim()
        ? body.message.trim().slice(0, 140)
        : 'Your notifications are working.',
    url: '/app/chat',
  }

  let sent = 0
  let removed = 0
  for (const subscription of subscriptions) {
    try {
      await sendWebPush(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        },
        payload
      )
      sent += 1
    } catch (pushError: any) {
      if (isGonePushError(pushError)) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('id', subscription.id)
        removed += 1
      } else {
        await logEvent({
          level: 'error',
          category: 'notifications',
          action: 'test_send_failed',
          userId,
          route,
          metadata: { message: pushError?.message ?? 'unknown_error' },
        })
      }
    }
  }

  await logEvent({
    level: 'info',
    category: 'notifications',
    action: 'test_sent',
    userId,
    route,
    metadata: { sent, removed },
  })

  return Response.json({ sent, removed }, { headers })
}
