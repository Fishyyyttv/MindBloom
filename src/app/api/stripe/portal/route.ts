import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import {
  buildRateLimitHeaders,
  buildRateLimitKey,
  checkRateLimit,
  getRequestPath,
  validateMutationOrigin,
} from '@/lib/api-security'
import { getRequiredEnv } from '@/lib/env'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'stripe.portal.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('stripe:portal', req, userId),
    limit: 30,
    windowMs: 60_000,
  })
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id')
    .eq('clerk_id', userId)
    .single()

  if (!user?.stripe_customer_id) {
    return Response.json({ error: 'No billing account found' }, { status: 404, headers })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${getRequiredEnv('NEXT_PUBLIC_APP_URL')}/api/stripe/sync?clerk_id=${userId}`,
  })

  return Response.json({ url: session.url }, { headers })
}
