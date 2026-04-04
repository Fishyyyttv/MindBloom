import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAppSubscriptionStatus } from '@/lib/subscription-status'
import { getRequiredEnv } from '@/lib/env'
import type Stripe from 'stripe'

function getCustomerId(subscription: Stripe.Subscription): string | null {
  if (typeof subscription.customer === 'string') return subscription.customer
  return subscription.customer?.id ?? null
}

async function findClerkIdByCustomerId(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('clerk_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  return data?.clerk_id ?? null
}

async function resolveClerkIdForSubscription(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  subscription: Stripe.Subscription
): Promise<string | null> {
  const fromMetadata = subscription.metadata?.clerk_id?.trim()
  if (fromMetadata) return fromMetadata

  if (typeof subscription.customer !== 'string' && !('deleted' in subscription.customer && subscription.customer.deleted)) {
    const customerMetadataId = subscription.customer.metadata?.clerk_id?.trim()
    if (customerMetadataId) return customerMetadataId
  }

  const customerId = getCustomerId(subscription)
  if (!customerId) return null

  const fromDatabase = await findClerkIdByCustomerId(supabaseAdmin, customerId)
  if (fromDatabase) return fromDatabase

  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (!('deleted' in customer)) {
      const fromCustomerMetadata = customer.metadata?.clerk_id?.trim()
      if (fromCustomerMetadata) return fromCustomerMetadata
    }
  } catch {
    // Ignore lookup errors and rely on later webhook retries.
  }

  return null
}

async function upsertSubscriptionState(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, subscription: Stripe.Subscription) {
  const clerkId = await resolveClerkIdForSubscription(supabaseAdmin, subscription)
  const customerId = getCustomerId(subscription)

  if (!clerkId) {
    // Fallback: if we only know customer id, still try to mark that record.
    if (customerId) {
      await supabaseAdmin
        .from('users')
        .update({
          subscription_id: subscription.id,
          subscription_status: getAppSubscriptionStatus(subscription),
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        })
        .eq('stripe_customer_id', customerId)
    }
    return
  }

  const payload = {
    subscription_id: subscription.id,
    subscription_status: getAppSubscriptionStatus(subscription),
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    stripe_customer_id: customerId,
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('users')
    .update(payload)
    .eq('clerk_id', clerkId)
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('Stripe webhook update failed:', updateError)
    return
  }

  if (updated) return

  const fallbackEmail = `${clerkId.replace(/[^a-zA-Z0-9._-]/g, '_')}@users.mindbloom.local`
  const { error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        clerk_id: clerkId,
        email: fallbackEmail,
        ...payload,
      },
      { onConflict: 'clerk_id' }
    )

  if (upsertError) {
    console.error('Stripe webhook upsert failed:', upsertError)
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, getRequiredEnv('STRIPE_WEBHOOK_SECRET'))
  } catch {
    return new Response('Webhook Error', { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertSubscriptionState(supabaseAdmin, subscription)
        break
      }
      default:
        break
    }
  } catch (error) {
    console.error('Stripe webhook handler failed:', error)
    return new Response('Webhook handler failed', { status: 500 })
  }

  return Response.json({ received: true })
}

