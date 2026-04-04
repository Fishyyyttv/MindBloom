import { getRequestPath } from '@/lib/api-security'
import { getOptionalEnv } from '@/lib/env'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isWebPushConfigured, sendWebPush } from '@/lib/web-push'

type DispatchKind = 'daily' | 'weekly'

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

function isAuthorizedCron(req: Request): boolean {
  const vercelCronHeader = req.headers.get('x-vercel-cron')
  if (vercelCronHeader) return true

  const secret = getOptionalEnv('NOTIFICATIONS_CRON_SECRET')
  if (!secret) return false

  return req.headers.get('x-notifications-secret') === secret
}

function isGonePushError(error: any): boolean {
  return error?.statusCode === 404 || error?.statusCode === 410
}

function parseKind(req: Request): DispatchKind {
  const kind = new URL(req.url).searchParams.get('kind')
  return kind === 'weekly' ? 'weekly' : 'daily'
}

function isAlreadySentToday(timestamp: string | null | undefined): boolean {
  if (!timestamp) return false
  const date = new Date(timestamp)
  const now = new Date()
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  )
}

function isAlreadySentThisWeek(timestamp: string | null | undefined): boolean {
  if (!timestamp) return false
  const date = new Date(timestamp).getTime()
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return date >= weekAgo
}

export async function GET(req: Request) {
  const route = getRequestPath(req)
  if (!isAuthorizedCron(req)) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'notifications.dispatch.unauthorized',
      route,
    })
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isWebPushConfigured()) {
    return Response.json({ error: 'Push notifications are not configured.' }, { status: 500 })
  }

  const kind = parseKind(req)
  const supabaseAdmin = getSupabaseAdmin()

  const { data: preferences, error: preferencesError } = await supabaseAdmin
    .from('notification_preferences')
    .select('user_id, push_enabled, daily_reminder, weekly_summary, last_daily_sent_at, last_weekly_sent_at')

  if (preferencesError) {
    if (isMissingTableError(preferencesError)) {
      return Response.json({ sent: 0, removed: 0, reason: 'notification_preferences table missing' })
    }
    return Response.json({ error: preferencesError.message }, { status: 500 })
  }

  const eligibleUserIds = (preferences ?? [])
    .filter((row) => row.push_enabled)
    .filter((row) => {
      if (kind === 'daily') {
        return row.daily_reminder && !isAlreadySentToday(row.last_daily_sent_at)
      }
      return row.weekly_summary && !isAlreadySentThisWeek(row.last_weekly_sent_at)
    })
    .map((row) => row.user_id)

  if (eligibleUserIds.length === 0) {
    return Response.json({ sent: 0, removed: 0, users: 0 })
  }

  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh_key, auth_key')
    .in('user_id', eligibleUserIds)

  if (subscriptionsError) {
    if (isMissingTableError(subscriptionsError)) {
      return Response.json({ sent: 0, removed: 0, reason: 'push_subscriptions table missing' })
    }
    return Response.json({ error: subscriptionsError.message }, { status: 500 })
  }

  const payload =
    kind === 'daily'
      ? {
          title: 'MindBloom daily check-in',
          body: 'Take 2 minutes for your mood check-in today.',
          url: '/app/mood',
        }
      : {
          title: 'MindBloom weekly summary',
          body: 'Review your week and set one small goal for next week.',
          url: '/app/diary',
        }

  let sent = 0
  let removed = 0
  const usersTouched = new Set<string>()

  for (const subscription of subscriptions ?? []) {
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
      usersTouched.add(subscription.user_id)
    } catch (pushError: any) {
      if (isGonePushError(pushError)) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('id', subscription.id)
        removed += 1
      } else {
        await logEvent({
          level: 'error',
          category: 'notifications',
          action: 'dispatch_send_failed',
          route,
          metadata: { message: pushError?.message ?? 'unknown_error' },
        })
      }
    }
  }

  if (usersTouched.size > 0) {
    const timestampColumn = kind === 'daily' ? 'last_daily_sent_at' : 'last_weekly_sent_at'
    await supabaseAdmin
      .from('notification_preferences')
      .update({
        [timestampColumn]: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('user_id', Array.from(usersTouched))
  }

  await logEvent({
    level: 'info',
    category: 'notifications',
    action: 'dispatch_completed',
    route,
    metadata: { kind, sent, removed, users: usersTouched.size },
  })

  return Response.json({ sent, removed, users: usersTouched.size })
}
