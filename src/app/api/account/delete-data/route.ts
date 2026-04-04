import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'
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
import { getStripeClient } from '@/lib/stripe'

const WORKSHEET_TABLES = ['worksheet_completions', 'worksheets_completions'] as const

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

async function deleteWorksheetRows(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  for (const table of WORKSHEET_TABLES) {
    const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId)
    if (!error || isMissingTableError(error)) continue
    throw error
  }
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
      action: 'delete_data.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('account:delete_data', req, userId),
    limit: 2,
    windowMs: 24 * 60 * 60_000,
  })
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    await logEvent({
      level: 'warn',
      category: 'rate_limit',
      action: 'delete_data.blocked',
      userId,
      route,
    })
    return Response.json(
      { error: 'Too many deletion requests. Please contact support if needed.' },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // Optional JSON body.
  }

  const reason = normalizeText(body?.reason, 1200) || null
  const supabaseAdmin = getSupabaseAdmin()
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null

  const { data: appUser, error: userLookupError } = await supabaseAdmin
    .from('users')
    .select('id, email, stripe_customer_id')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (userLookupError) {
    await logEvent({
      level: 'error',
      category: 'delete_data',
      action: 'user_lookup_failed',
      userId,
      route,
      metadata: { message: userLookupError.message, code: userLookupError.code },
    })
    return Response.json({ error: userLookupError.message }, { status: 500, headers: rateLimitHeaders })
  }

  let deletionRequestId: string | null = null
  const userRecordId = appUser?.id ?? null
  const emailSnapshot = email || appUser?.email || null
  const requestedAt = new Date().toISOString()

  const { data: requestRow, error: requestInsertError } = await supabaseAdmin
    .from('data_deletion_requests')
    .insert({
      user_id: userRecordId,
      clerk_id: userId,
      email_snapshot: emailSnapshot,
      reason,
      status: 'processing',
      requested_at: requestedAt,
    })
    .select('id')
    .maybeSingle()

  if (!requestInsertError) {
    deletionRequestId = requestRow?.id ?? null
  } else if (!isMissingTableError(requestInsertError)) {
    await logEvent({
      level: 'error',
      category: 'delete_data',
      action: 'request_insert_failed',
      userId,
      route,
      metadata: { message: requestInsertError.message, code: requestInsertError.code },
    })
    return Response.json({ error: requestInsertError.message }, { status: 500, headers: rateLimitHeaders })
  }

  await logEvent({
    level: 'info',
    category: 'delete_data',
    action: 'requested',
    userId,
    route,
    metadata: { requestId: deletionRequestId, hasAppUser: Boolean(appUser?.id) },
  })

  try {
    if (appUser?.stripe_customer_id) {
      try {
        const stripe = getStripeClient()
        await stripe.customers.del(appUser.stripe_customer_id)
      } catch (stripeDeleteError: any) {
        await logEvent({
          level: 'warn',
          category: 'delete_data',
          action: 'stripe_delete_failed',
          userId,
          route,
          metadata: { message: stripeDeleteError?.message ?? 'unknown_error' },
        })
      }
    }

    if (appUser?.id) {
      const tablesWithUserId = [
        'mood_logs',
        'diary_entries',
        'skill_sessions',
        'bug_reports',
        'feature_requests',
        'chat_sessions',
        'push_subscriptions',
        'notification_preferences',
      ]

      for (const table of tablesWithUserId) {
        const { error } = await supabaseAdmin.from(table).delete().eq('user_id', appUser.id)
        if (!error || isMissingTableError(error)) continue
        throw error
      }

      await deleteWorksheetRows(supabaseAdmin, appUser.id)

      const { error: deleteUserError } = await supabaseAdmin.from('users').delete().eq('id', appUser.id)
      if (deleteUserError) throw deleteUserError
    }

    // Delete identity account last so this request can still finish cleanly.
    await clerkClient.users.deleteUser(userId)

    if (deletionRequestId) {
      await supabaseAdmin
        .from('data_deletion_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', deletionRequestId)
    }

    await logEvent({
      level: 'info',
      category: 'delete_data',
      action: 'completed',
      userId,
      route,
      metadata: { requestId: deletionRequestId },
    })

    return Response.json({ success: true }, { headers: rateLimitHeaders })
  } catch (error: any) {
    if (deletionRequestId) {
      await supabaseAdmin
        .from('data_deletion_requests')
        .update({
          status: 'failed',
          failure_reason: normalizeText(error?.message, 500) || 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', deletionRequestId)
    }

    await logEvent({
      level: 'error',
      category: 'delete_data',
      action: 'failed',
      userId,
      route,
      metadata: {
        requestId: deletionRequestId,
        message: normalizeText(error?.message, 500) || 'unknown_error',
      },
    })

    return Response.json(
      { error: error?.message || 'Failed to delete account data' },
      { status: 500, headers: rateLimitHeaders }
    )
  }
}
