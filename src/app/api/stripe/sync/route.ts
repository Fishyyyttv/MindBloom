import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getStripeClient } from '@/lib/stripe'
import { getAppSubscriptionStatus } from '@/lib/subscription-status'
import { logEvent } from '@/lib/monitoring'
import type Stripe from 'stripe'

function getSubscriptionFromList(data: Stripe.ApiList<Stripe.Subscription>['data']) {
  if (!Array.isArray(data) || data.length === 0) return null
  return data[0]
}

export async function GET(req: NextRequest) {
  const { userId: authUserId } = await auth()
  const queryClerkId = req.nextUrl.searchParams.get('clerk_id')
  const clerkId = queryClerkId || authUserId

  if (!clerkId) {
    redirect('/app/chat')
  }

  const supabaseAdmin = getSupabaseAdmin()
  const stripe = getStripeClient()

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('clerk_id', clerkId)
      .maybeSingle()

    if (error) {
      await logEvent({
        level: 'error',
        category: 'stripe',
        action: 'sync_user_lookup_failed',
        userId: clerkId,
        route: '/api/stripe/sync',
        metadata: { message: error.message, code: error.code },
      })
      redirect('/app/chat')
    }

    if (!user?.stripe_customer_id) {
      await supabaseAdmin
        .from('users')
        .update({ subscription_status: 'canceled', subscription_id: null, trial_end: null })
        .eq('clerk_id', clerkId)
      redirect('/app/chat')
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 10,
      status: 'all',
    })

    const subscription = getSubscriptionFromList(subscriptions.data)

    if (!subscription) {
      await supabaseAdmin
        .from('users')
        .update({ subscription_status: 'canceled', subscription_id: null, trial_end: null })
        .eq('clerk_id', clerkId)
      redirect('/app/chat')
    }

    await supabaseAdmin
      .from('users')
      .update({
        subscription_id: subscription.id,
        subscription_status: getAppSubscriptionStatus(subscription),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      })
      .eq('clerk_id', clerkId)
  } catch (syncError) {
    await logEvent({
      level: 'error',
      category: 'stripe',
      action: 'sync_failed',
      userId: clerkId,
      route: '/api/stripe/sync',
      metadata: { message: syncError instanceof Error ? syncError.message : 'unknown_error' },
    })
  }

  redirect('/app/chat')
}

