import { auth } from '@clerk/nextjs/server'
import { stripe, PLANS } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  let stripeCustomerId: string | undefined

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id, subscription_status')
    .eq('clerk_id', userId)
    .single()

  // Already active or trialing — send them to the app
  if (user?.subscription_status === 'active' || user?.subscription_status === 'trialing') {
    return Response.json({ url: `${appUrl}/app/chat` })
  }

  if (user?.stripe_customer_id) {
    stripeCustomerId = user.stripe_customer_id

    // Check if this customer has EVER had a trial in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 10,
    })

    const hadTrialBefore = subscriptions.data.some(sub =>
      sub.trial_start !== null
    )

    // If they already used a trial, create checkout WITHOUT a trial
    if (hadTrialBefore) {
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: PLANS.monthly.priceId, quantity: 1 }],
        success_url: `${appUrl}/api/stripe/sync?clerk_id=${userId}`,
        cancel_url: `${appUrl}/subscribe`,
      })
      return Response.json({ url: session.url })
    }
  } else {
    const customer = await stripe.customers.create({ email, metadata: { clerk_id: userId } })
    stripeCustomerId = customer.id
    await supabaseAdmin
      .from('users')
      .upsert({ clerk_id: userId, email, stripe_customer_id: customer.id })
  }

  // First time — give them the trial
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

  return Response.json({ url: session.url })
}