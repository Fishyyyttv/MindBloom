import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Webhook Error', { status: 400 })
  }

  const getClerkId = (obj: Stripe.Subscription | Stripe.Customer) => {
    if ('metadata' in obj) return obj.metadata?.clerk_id
    return null
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const clerkId = getClerkId(sub)
      if (clerkId) {
        await supabaseAdmin.from('users').upsert({
          clerk_id: clerkId,
          subscription_id: sub.id,
          subscription_status: sub.status as 'active' | 'canceled' | 'past_due' | 'trialing',
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        }, { onConflict: 'clerk_id' })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const clerkId = getClerkId(sub)
      if (clerkId) {
        await supabaseAdmin.from('users')
          .update({ subscription_status: 'canceled' })
          .eq('clerk_id', clerkId)
      }
      break
    }
  }

  return Response.json({ received: true })
}
