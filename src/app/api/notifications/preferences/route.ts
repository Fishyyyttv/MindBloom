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

const DEFAULT_PREFERENCES = {
  pushEnabled: false,
  dailyReminder: true,
  weeklySummary: false,
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  return fallback
}

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('notifications:preferences:get', req, userId),
    limit: 120,
    windowMs: 60_000,
  })
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers })
  }

  const appUser = await ensureAppUser({ clerkId: userId })
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('notification_preferences')
    .select('push_enabled, daily_reminder, weekly_summary')
    .eq('user_id', appUser.id)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return Response.json(DEFAULT_PREFERENCES, { headers })
    }

    await logEvent({
      level: 'error',
      category: 'notifications',
      action: 'preferences_get_failed',
      userId,
      route: getRequestPath(req),
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  return Response.json(
    {
      pushEnabled: data?.push_enabled ?? DEFAULT_PREFERENCES.pushEnabled,
      dailyReminder: data?.daily_reminder ?? DEFAULT_PREFERENCES.dailyReminder,
      weeklySummary: data?.weekly_summary ?? DEFAULT_PREFERENCES.weeklySummary,
    },
    { headers }
  )
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
      action: 'notifications.preferences.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('notifications:preferences:post', req, userId),
    limit: 80,
    windowMs: 60_000,
  })
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many writes. Please slow down for a moment.' }, { status: 429, headers })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  const clerkUser = await currentUser()
  const appUser = await ensureAppUser({
    clerkId: userId,
    email: clerkUser?.emailAddresses?.[0]?.emailAddress,
  })
  const supabaseAdmin = getSupabaseAdmin()

  const pushEnabled = toBoolean(body?.pushEnabled, DEFAULT_PREFERENCES.pushEnabled)
  const dailyReminder = toBoolean(body?.dailyReminder, DEFAULT_PREFERENCES.dailyReminder)
  const weeklySummary = toBoolean(body?.weeklySummary, DEFAULT_PREFERENCES.weeklySummary)

  const { error } = await supabaseAdmin.from('notification_preferences').upsert(
    {
      user_id: appUser.id,
      push_enabled: pushEnabled,
      daily_reminder: dailyReminder,
      weekly_summary: weeklySummary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    if (isMissingTableError(error)) {
      return Response.json(
        { error: 'notification_preferences table not found. Run the Supabase SQL migration first.' },
        { status: 500, headers }
      )
    }

    await logEvent({
      level: 'error',
      category: 'notifications',
      action: 'preferences_update_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  await logEvent({
    level: 'info',
    category: 'notifications',
    action: 'preferences_updated',
    userId,
    route,
    metadata: { pushEnabled, dailyReminder, weeklySummary },
  })

  return Response.json({ success: true }, { headers })
}
