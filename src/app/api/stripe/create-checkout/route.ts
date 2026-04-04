import { auth } from '@clerk/nextjs/server'
import { getStripeClient, PLANS } from '@/lib/stripe'
import {
  buildRateLimitHeaders,
  buildRateLimitKey,
  checkRateLimit,
  getRequestPath,
  validateMutationOrigin,
} from '@/lib/api-security'
import { getOptionalEnv } from '@/lib/env'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase().slice(0, 320)
}

function resolveAppUrl(req: Request): string {
  const configured = getOptionalEnv('NEXT_PUBLIC_APP_URL')
  if (configured) return configured.replace(/\/+$/, '')

  try {
    return new URL(req.url).origin
  } catch {
    return 'https://mymindbloom.app'
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'stripe.checkout.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('stripe:checkout', req, userId),
    limit: 20,
    windowMs: 60_000,
  })
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  const email = normalizeEmail(body?.email)
  const appUrl = resolveAppUrl(req)

  try {
    const stripe = getStripeClient()
    let stripeCustomerId: string | undefined

    const supabaseAdmin = getSupabaseAdmin()
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, subscription_status')
      .eq('clerk_id', userId)
      .maybeSingle()

    if (user?.subscription_status === 'active' || user?.subscription_status === 'trialing') {
      return Response.json({ url: `${appUrl}/app/chat` }, { headers })
    }

    if (user?.stripe_customer_id) {
      stripeCustomerId = user.stripe_customer_id

      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        limit: 10,
      })

      const hadTrialBefore = subscriptions.data.some((sub) => sub.trial_start !== null)
      if (hadTrialBefore) {
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: PLANS.monthly.priceId, quantity: 1 }],
          success_url: `${appUrl}/api/stripe/sync?clerk_id=${userId}`,
          cancel_url: `${appUrl}/subscribe`,
        })
        return Response.json({ url: session.url }, { headers })
      }
    } else {
      if (!email) {
        return Response.json({ error: 'Email is required for first checkout.' }, { status: 400, headers })
      }
      const customer = await stripe.customers.create({ email, metadata: { clerk_id: userId } })
      stripeCustomerId = customer.id
      await supabaseAdmin
        .from('users')
        .upsert({ clerk_id: userId, email, stripe_customer_id: customer.id }, { onConflict: 'clerk_id' })
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS.monthly.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: PLANS.monthly.trialDays,
        metadata: { clerk_id: userId },
      },
      success_url: `${appUrl}/api/stripe/sync?clerk_id=${userId}`,
      cancel_url: `${appUrl}/subscribe`,
      allow_promotion_codes: true,
    })

    await logEvent({
      level: 'info',
      category: 'stripe',
      action: 'checkout_session_created',
      userId,
      route,
      metadata: { hasExistingCustomer: Boolean(user?.stripe_customer_id) },
    })

    return Response.json({ url: session.url }, { headers })
  } catch (error) {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Unable to start checkout right now.'

    await logEvent({
      level: 'error',
      category: 'stripe',
      action: 'checkout_session_failed',
      userId,
      route,
      metadata: { message },
    })

    return Response.json(
      {
        error: message.includes('No such price')
          ? 'Stripe price is invalid for this environment. Update STRIPE_PRICE_ID in Vercel.'
          : message,
      },
      { status: 500, headers }
    )
  }
}
